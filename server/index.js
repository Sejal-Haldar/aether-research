import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[WARNING] GEMINI_API_KEY environment variable is missing!');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Baseline initial nodes (kept from original implementation)
const initialNodes = [
  {
    id: 'node-transformers',
    title: 'Transformers',
    category: 'ARCHITECTURE',
    categories: ['ARCHITECTURE'],
    badge: 'ARCHITECTURE',
    description: 'A deep learning architecture relying entirely on an attention mechanism.',
    tags: ['nlp', 'deep-learning'],
    x: 380,
    y: 80,
    status: 'Verified'
  }
];

// NOTE: this remains an in-memory, process-lifetime "database" as in the
// original implementation. It resets on server restart and is shared
// across all requests/users. Swapping this for a real datastore is out of
// scope for this fix (see final report / remaining limitations) but the
// CRUD surface below is now at least complete and consistent.
let storedNodes = [...initialNodes];

// Minimum characters of extractable text before we consider a PDF's text
// layer usable. Below this we still forward the file to Gemini (which can
// read PDFs natively/visually) but we flag the extraction as image-only.
const MIN_EXTRACTABLE_TEXT_LENGTH = 40;

// ---------------------------------------------------------------------------
// Structured analysis schema — matches ResearchAnalysisData in
// src/types/graph.ts exactly (field names included), so the frontend's
// existing buildResearchGraph() utility can consume this response with zero
// translation layer.
// ---------------------------------------------------------------------------
const EXTRACTION_PROMPT = `
You are a research/document intelligence analyst. Analyze ONLY the document
content provided below (or attached) — do not use outside knowledge to invent
facts that are not present in the source.

Produce:
- title: the document's actual title/subject if determinable, otherwise a short accurate descriptor.
- summary.short: a 2-4 sentence summary based ONLY on the provided content.
- summary.detailed: a longer paragraph summary (omit or leave empty string if the content is too short for this to be meaningful).
- summary.keyTakeaways: 3-8 concrete key points / facts actually stated in the content.
- entities: 5-20 important concepts, technologies, people, methods, components, or theories ACTUALLY discussed in the content. Do not invent entities that aren't present. If the content is too short/trivial to support 5, return however many are genuinely supported — never pad with generic filler.
- relationships: meaningful directed relationships between entities using verbs like causes, depends on, consists of, enables, produces, related to, example of, contrasts with. Use each relationship's "relation" field for the verb phrase, "sourceId" and "targetId" as the exact entity names (case-insensitive match is fine) they connect.
- flowchart: ONLY if the content describes an actual process, workflow, algorithm, mechanism, or sequence of steps. Each step needs a stepNumber, a label, a type ('start' | 'process' | 'decision' | 'end'), and nextSteps (array of stepNumbers it flows to). If there is no real process described, return an empty array — never fabricate one.
- notes: structured notes as an array of sections, each with a heading, bullets (facts/explanations that actually appear in the source), and optionally definitions or formulasOrConcepts if the source actually defines terms or presents formulas. Return an empty array if the content doesn't support structured notes.

If the provided content is empty, unreadable, or contains no substantive information, return empty arrays for entities/relationships/flowchart/notes and say so plainly in summary.short. Do not fabricate placeholder content under any circumstances.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: {
      type: Type.OBJECT,
      properties: {
        short: { type: Type.STRING },
        detailed: { type: Type.STRING },
        keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['short']
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the concept or entity' },
          category: { type: Type.STRING, description: 'Category (e.g., MODEL, ARCHITECTURE, MECHANISM, DATASET, METRIC, CONCEPT)' },
          description: { type: Type.STRING, description: '1-2 sentence overview grounded in the source content' }
        },
        required: ['name', 'category', 'description']
      }
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sourceId: { type: Type.STRING, description: 'Source entity name' },
          targetId: { type: Type.STRING, description: 'Target entity name' },
          relation: { type: Type.STRING, description: 'Relationship predicate, e.g. depends on, enables, produces' }
        },
        required: ['sourceId', 'targetId', 'relation']
      }
    },
    flowchart: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.NUMBER },
          label: { type: Type.STRING },
          type: { type: Type.STRING, description: "one of 'start' | 'process' | 'decision' | 'end'" },
          nextSteps: { type: Type.ARRAY, items: { type: Type.NUMBER } }
        },
        required: ['stepNumber', 'label', 'type']
      }
    },
    notes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          formulasOrConcepts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['heading', 'bullets']
      }
    }
  },
  required: ['summary', 'entities', 'relationships']
};

function cleanJsonResponse(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

// Validates the AI's parsed JSON actually matches the shape we need before
// we trust it downstream, rather than assuming arbitrary structure parsed ok.
function validateAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return 'Response was not a JSON object.';
  if (!obj.summary || typeof obj.summary.short !== 'string') return 'Missing summary.short.';
  if (!Array.isArray(obj.entities)) return 'Missing entities array.';
  if (!Array.isArray(obj.relationships)) return 'Missing relationships array.';
  for (const e of obj.entities) {
    if (!e || typeof e.name !== 'string' || !e.name.trim()) {
      return 'One or more entities is missing a valid name.';
    }
  }
  return null; // valid
}

// Fixed Model Fallback Sequence
async function callGeminiWithFallback(contentsPayload) {
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      console.log(`[Gemini API] Executing extraction with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`[Gemini API] Model ${model} error: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini candidate models failed to generate content.');
}

// ---------------------------------------------------------------------------
// Normalization: PDF bytes / URL / raw text all become a common
// NormalizedDocument before analysis, per the PDF+URL -> Normalized Document
// -> Analysis flow.
// ---------------------------------------------------------------------------

class IngestError extends Error {
  constructor(stage, message, status = 400) {
    super(message);
    this.stage = stage; // 'network' | 'access' | 'extraction' | 'ai' | 'validation'
    this.status = status;
  }
}

async function normalizePdfBuffer(buffer, filenameHint) {
  let parsed;
  try {
    parsed = await pdfParse(buffer);
  } catch (err) {
    throw new IngestError('extraction', `Could not parse PDF: ${err.message}`, 422);
  }

  const text = (parsed.text || '').trim();
  const pageCount = parsed.numpages || null;
  const isTextLayerUsable = text.length >= MIN_EXTRACTABLE_TEXT_LENGTH;

  return {
    sourceType: 'pdf',
    title: (parsed.info && parsed.info.Title && parsed.info.Title.trim()) || filenameHint || 'Untitled PDF',
    text,
    pageCount,
    extractionStatus: isTextLayerUsable ? 'ok' : 'image-only-or-empty',
    rawBufferBase64: buffer.toString('base64') // kept so we can also give Gemini native PDF vision as a fallback
  };
}

async function normalizeUrl(targetUrl) {
  let urlResponse;
  try {
    urlResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
  } catch (err) {
    throw new IngestError('network', `Could not reach URL: ${err.message}`, 400);
  }

  if (!urlResponse.ok) {
    throw new IngestError(
      'access',
      `URL responded with ${urlResponse.status} ${urlResponse.statusText}`,
      400
    );
  }

  const contentType = urlResponse.headers.get('content-type') || '';

  if (contentType.includes('application/pdf') || targetUrl.toLowerCase().endsWith('.pdf')) {
    const arrayBuffer = await urlResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const normalized = await normalizePdfBuffer(buffer, targetUrl);
    normalized.sourceType = 'url-pdf';
    return normalized;
  }

  const rawHtml = await urlResponse.text();
  const cleanText = rawHtml
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<nav\b[^<]*>([\s\S]*?)<\/nav>/gi, '')
    .replace(/<footer\b[^<]*>([\s\S]*?)<\/footer>/gi, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : targetUrl;

  if (cleanText.length < MIN_EXTRACTABLE_TEXT_LENGTH) {
    throw new IngestError(
      'extraction',
      'The page loaded but no meaningful article/page content could be extracted from it.',
      422
    );
  }

  return {
    sourceType: 'url',
    title,
    text: cleanText.slice(0, 40000),
    pageCount: null,
    extractionStatus: 'ok'
  };
}

function normalizeRawText(text, hintTitle) {
  const trimmed = (text || '').trim();
  if (trimmed.length < MIN_EXTRACTABLE_TEXT_LENGTH) {
    throw new IngestError('extraction', 'Provided text is too short to analyze meaningfully.', 400);
  }
  return {
    sourceType: 'text',
    title: hintTitle || 'Pasted Text',
    text: trimmed,
    pageCount: null,
    extractionStatus: 'ok'
  };
}

function buildGeminiPayload(doc) {
  const parts = [{ text: `${EXTRACTION_PROMPT}\n\nDocument title (if known): ${doc.title}\n` }];

  if (doc.rawBufferBase64) {
    // PDF: give Gemini native multimodal access to the file itself (covers
    // scanned/image-only pages) in addition to whatever text layer we found.
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: doc.rawBufferBase64
      }
    });
    if (doc.text) {
      parts.push({ text: `Extracted text layer (may be partial):\n\n${doc.text.slice(0, 40000)}` });
    }
  } else {
    parts.push({ text: `Content:\n\n${doc.text}` });
  }

  return parts;
}

// --- API ENDPOINTS ---

app.get('/api/nodes', (req, res) => res.json(storedNodes));

app.post('/api/nodes', (req, res) => {
  const incoming = req.body || {};
  const id = incoming.id || `node-${Date.now()}`;
  const node = { ...incoming, id };
  storedNodes = [...storedNodes, node];
  res.status(201).json(node);
});

app.put('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  const idx = storedNodes.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `Node ${id} not found.` });
  }
  storedNodes[idx] = { ...storedNodes[idx], ...req.body };
  res.json(storedNodes[idx]);
});

app.delete('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  const existed = storedNodes.some((n) => n.id === id);
  storedNodes = storedNodes.filter((n) => n.id !== id);
  res.json({ success: true, deleted: existed });
});

app.post('/api/extract-graph', upload.single('file'), async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is missing on backend server.',
      stage: 'config'
    });
  }

  try {
    let doc;

    // 1. File Upload (PDF or plain text file)
    if (req.file) {
      console.log(`[Pipeline] Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);
      const isPdf = (req.file.mimetype || '').includes('pdf') || req.file.originalname.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        doc = await normalizePdfBuffer(req.file.buffer, req.file.originalname);
      } else {
        doc = normalizeRawText(req.file.buffer.toString('utf-8'), req.file.originalname);
      }
    }
    // 2. URL
    else if (req.body && req.body.url && req.body.url.trim()) {
      console.log(`[Pipeline] Fetching URL: ${req.body.url}`);
      doc = await normalizeUrl(req.body.url.trim());
    }
    // 3. Raw pasted text
    else if (req.body && req.body.text && req.body.text.trim()) {
      console.log('[Pipeline] Ingesting raw pasted text');
      doc = normalizeRawText(req.body.text, req.body.title);
    } else {
      return res.status(400).json({ error: 'Please supply a PDF file, a URL, or pasted text.', stage: 'input' });
    }

    // Do not silently continue on unusable content — surface it now.
    if (doc.sourceType === 'pdf' || doc.sourceType === 'url-pdf') {
      if (doc.extractionStatus !== 'ok') {
        console.warn('[Pipeline] PDF text layer looks empty/image-only; falling back to Gemini vision on raw bytes.');
      }
    }

    const contentsPayload = buildGeminiPayload(doc);
    const rawResultText = await callGeminiWithFallback(contentsPayload);

    let analysis;
    try {
      analysis = JSON.parse(cleanJsonResponse(rawResultText));
    } catch (err) {
      return res.status(502).json({
        error: 'The AI returned a response that was not valid JSON.',
        stage: 'ai',
        details: err.message
      });
    }

    const validationError = validateAnalysis(analysis);
    if (validationError) {
      return res.status(502).json({
        error: `The AI response did not match the expected structure: ${validationError}`,
        stage: 'validation'
      });
    }

    if (!analysis.title) analysis.title = doc.title;

    res.json({
      success: true,
      data: analysis,
      meta: {
        sourceType: doc.sourceType,
        title: doc.title,
        pageCount: doc.pageCount,
        extractionStatus: doc.extractionStatus || 'ok',
        extractedTextLength: doc.text ? doc.text.length : 0
      }
    });
  } catch (err) {
    if (err instanceof IngestError) {
      console.error(`[Pipeline Error][${err.stage}]:`, err.message);
      return res.status(err.status).json({ error: err.message, stage: err.stage });
    }
    console.error('[Pipeline Error]:', err);
    res.status(500).json({
      error: 'Graph extraction failed',
      stage: 'unknown',
      details: err.message || 'Unknown server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

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

// Baseline initial nodes
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

let storedNodes = [...initialNodes];

// System Prompt
const EXTRACTION_PROMPT = `
Analyze the provided document or webpage content thoroughly.
Extract between 8 to 20 key concepts, components, entities, or architectures mentioned in the text.
Create direct directional relationships between related entities.
`;

// Structured Output Schema
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the concept or entity' },
          type: { type: Type.STRING, description: 'Category (e.g., ARCHITECTURE, MODEL, MECHANISM, CONCEPT)' },
          description: { type: Type.STRING, description: '1-2 sentence overview' }
        },
        required: ['name', 'type', 'description']
      }
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: 'Source concept name' },
          target: { type: Type.STRING, description: 'Target concept name' },
          type: { type: Type.STRING, description: 'Relationship predicate (e.g., uses, contains, enhances)' }
        },
        required: ['source', 'target', 'type']
      }
    }
  },
  required: ['concepts', 'relationships']
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

// --- API ENDPOINTS ---

app.get('/api/nodes', (req, res) => res.json(storedNodes));

app.post('/api/extract-graph', upload.single('file'), async (req, res) => {
  // Check API Key explicitly
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is missing on backend server.' 
    });
  }

  try {
    let contentsPayload = [];

    // 1. File Upload Processing
    if (req.file) {
      console.log(`[Pipeline] Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'application/pdf';

      contentsPayload = [
        { text: EXTRACTION_PROMPT },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ];
    } 
    // 2. URL Content Processing
    else if (req.body && req.body.url) {
      const targetUrl = req.body.url.trim();
      console.log(`[Pipeline] Fetching URL: ${targetUrl}`);

      const urlResponse = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!urlResponse.ok) {
        return res.status(400).json({ error: `Failed to fetch URL (${urlResponse.status}: ${urlResponse.statusText})` });
      }

      const contentType = urlResponse.headers.get('content-type') || '';

      if (contentType.includes('application/pdf') || targetUrl.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await urlResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        contentsPayload = [
          { text: EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          }
        ];
      } else {
        const rawHtml = await urlResponse.text();
        const cleanText = rawHtml
          .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        contentsPayload = [
          { text: `Webpage content:\n\n${cleanText.slice(0, 40000)}\n\n${EXTRACTION_PROMPT}` }
        ];
      }
    } else {
      return res.status(400).json({ error: 'Please supply a PDF file or URL.' });
    }

    const rawResultText = await callGeminiWithFallback(contentsPayload);
    const cleanedJsonText = cleanJsonResponse(rawResultText);
    const graphPayload = JSON.parse(cleanedJsonText);

    const formattedNodes = (graphPayload.concepts || []).map((concept, index) => {
      const slugId = `node-${concept.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const col = index % 3;
      const row = Math.floor(index / 3);

      return {
        id: slugId,
        title: concept.name,
        category: (concept.type || 'CONCEPT').toUpperCase(),
        categories: [(concept.type || 'CONCEPT').toUpperCase()],
        badge: (concept.type || 'CONCEPT').toUpperCase(),
        description: concept.description,
        tags: [concept.type ? concept.type.toLowerCase() : 'concept', 'extracted'],
        x: 100 + col * 300,
        y: 100 + row * 240,
        glow: index === 0,
        status: 'Extracted',
        complexityMatrix: {
          timeComplexity: 'Dynamic',
          spaceComplexity: 'Dynamic',
          parallelizable: 'Medium',
          parameters: 'N/A',
          type: concept.type || 'Entity'
        },
        notes: []
      };
    });

    const formattedEdges = (graphPayload.relationships || []).map((rel, index) => {
      const sourceId = `node-${rel.source.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const targetId = `node-${rel.target.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      return {
        id: `edge-${index}-${Date.now()}`,
        source: sourceId,
        target: targetId,
        label: rel.type
      };
    });

    storedNodes = [...storedNodes, ...formattedNodes];

    res.json({
      success: true,
      nodes: formattedNodes,
      edges: formattedEdges
    });

  } catch (err) {
    console.error('[Pipeline Error]:', err);
    res.status(500).json({ 
      error: 'Graph extraction failed', 
      details: err.message || 'Unknown server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
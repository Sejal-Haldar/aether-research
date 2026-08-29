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
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Default mock nodes to fall back on if canvas is cleared
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

// System prompt instructing Gemini to build nodes and edges
const EXTRACTION_PROMPT = `
Analyze the provided document or webpage thoroughly.
Extract at least 8 to 20 key concepts, components, entities, or architectures mentioned in the text.
Create direct directional relationships between related entities.
`;

// Gemini response schema definition
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
          type: { type: Type.STRING, description: 'Relationship (e.g., uses, contains, enhances)' }
        },
        required: ['source', 'target', 'type']
      }
    }
  },
  required: ['concepts', 'relationships']
};

// Model execution helper with automatic fallback
async function callGeminiWithFallback(contentsPayload) {
  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      console.log(`[Gemini API] Attempting extraction with model: ${model}`);
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
      console.warn(`[Gemini API] Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini model candidates failed.');
}

// --- GRAPH ENDPOINTS ---

app.get('/api/nodes', (req, res) => res.json(storedNodes));

app.post('/api/extract-graph', upload.single('file'), async (req, res) => {
  try {
    let contentsPayload = [];

    // 1. Handle File Upload (Direct Native Multimodal PDF)
    if (req.file) {
      console.log(`[Pipeline] Processing uploaded PDF: ${req.file.originalname} (${req.file.size} bytes)`);
      const base64Data = req.file.buffer.toString('base64');
      
      contentsPayload = [
        {
          inlineData: {
            mimeType: req.file.mimetype || 'application/pdf',
            data: base64Data
          }
        },
        EXTRACTION_PROMPT
      ];
    }
    // 2. Handle URL Link Input
    else if (req.body && req.body.url) {
      const targetUrl = req.body.url.trim();
      console.log(`[Pipeline] Fetching URL: ${targetUrl}`);

      const urlResponse = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!urlResponse.ok) {
        return res.status(400).json({ error: `Failed to fetch URL (${urlResponse.status} ${urlResponse.statusText})` });
      }

      const contentType = urlResponse.headers.get('content-type') || '';

      if (contentType.includes('application/pdf') || targetUrl.toLowerCase().endsWith('.pdf')) {
        console.log('[Pipeline] URL is a PDF document.');
        const arrayBuffer = await urlResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        contentsPayload = [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          },
          EXTRACTION_PROMPT
        ];
      } else {
        console.log('[Pipeline] URL is an HTML webpage.');
        const rawHtml = await urlResponse.text();
        const cleanText = rawHtml
          .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length > 100) {
          contentsPayload = [
            `Webpage text from (${targetUrl}):\n\n${cleanText.slice(0, 40000)}\n\n${EXTRACTION_PROMPT}`
          ];
        } else {
          contentsPayload = [
            `Target Web URL: ${targetUrl}. Extract relevant core concepts, technical systems, components, and relationships associated with this entity or subject.\n\n${EXTRACTION_PROMPT}`
          ];
        }
      }
    } else {
      return res.status(400).json({ error: 'Please upload a PDF file or provide a valid URL.' });
    }

    // Call Gemini API
    const rawResultText = await callGeminiWithFallback(contentsPayload);
    const graphPayload = JSON.parse(rawResultText);

    // Format Nodes for Frontend
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

    // Format Edges for Frontend
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

    console.log(`[Pipeline] Successfully generated ${formattedNodes.length} nodes and ${formattedEdges.length} edges.`);

    res.json({
      success: true,
      nodes: formattedNodes,
      edges: formattedEdges
    });

  } catch (err) {
    console.error('[Pipeline Error]', err);
    res.status(500).json({ error: 'Extraction failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
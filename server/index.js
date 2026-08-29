import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
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
  limits: { fileSize: 50 * 1024 * 1024 }
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Baseline default nodes matching initial state
const initialNodes = [
  {
    id: 'node-transformers',
    title: 'Transformers',
    category: 'ARCHITECTURE',
    categories: ['ARCHITECTURE'],
    badge: 'ARCHITECTURE',
    description: 'A deep learning architecture relying entirely on an attention mechanism to draw global dependencies.',
    tags: ['nlp', 'deep-learning', 'attention'],
    x: 380,
    y: 80,
    glow: true,
    status: 'Verified',
    complexityMatrix: {
      timeComplexity: 'O(n² · d)',
      spaceComplexity: 'O(n²)',
      parallelizable: 'High',
      parameters: 'Dynamic',
      type: 'Modular Block'
    },
    notes: []
  },
  {
    id: 'node-bert',
    title: 'BERT',
    category: 'MODEL',
    categories: ['MODEL'],
    badge: 'MODEL',
    description: 'Bidirectional Encoder Representations from Transformers pre-trained on deep contextual representations.',
    tags: ['attention', 'nlp', 'encoder'],
    x: 80,
    y: 80,
    glow: false,
    status: 'Verified',
    complexityMatrix: {
      timeComplexity: 'O(n · d)',
      spaceComplexity: 'O(n)',
      parallelizable: 'High',
      parameters: '110M / 340M',
      type: 'Encoder Network'
    },
    notes: []
  },
  {
    id: 'node-roberta',
    title: 'RoBERTa',
    category: 'MODEL',
    categories: ['MODEL'],
    badge: 'MODEL',
    description: 'A Robustly Optimized BERT Pretraining Approach demonstrating improved hyperparameter tuning.',
    tags: ['nlp', 'optimized-bert', 'dynamic-masking'],
    x: 80,
    y: 320,
    glow: false,
    status: 'Verified',
    complexityMatrix: {
      timeComplexity: 'O(n · d)',
      spaceComplexity: 'O(n)',
      parallelizable: 'High',
      parameters: '125M / 355M',
      type: 'Encoder Network'
    },
    notes: []
  },
  {
    id: 'node-self-attention',
    title: 'Self-Attention',
    category: 'MECHANISM',
    categories: ['MECHANISM'],
    badge: 'MECHANISM',
    description: 'Contextual weighting mechanism for parallelized representations mapping Queries, Keys, and Values.',
    tags: ['mechanism', 'matrix-op', 'scaled-dot-product'],
    x: 380,
    y: 320,
    glow: false,
    status: 'Verified',
    complexityMatrix: {
      timeComplexity: 'O(n² · d)',
      spaceComplexity: 'O(n²)',
      parallelizable: 'High',
      parameters: 'QKV Matrices',
      type: 'Attention Block'
    },
    notes: []
  },
  {
    id: 'node-positional-encoding',
    title: 'Positional Encoding',
    category: 'MECHANISM',
    categories: ['MECHANISM'],
    badge: 'MECHANISM',
    description: 'Sinusoidal and rotary positional information injected into input vectors to preserve order.',
    tags: ['embedding', 'position'],
    x: 680,
    y: 80,
    glow: false,
    status: 'Verified',
    complexityMatrix: {
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(n · d)',
      parallelizable: 'High',
      parameters: 'Deterministic',
      type: 'Vector Function'
    },
    notes: []
  }
];

let storedNodes = [...initialNodes];

// Helper: Model Fallback execution sequence
async function generateGraphWithFallback(contentsPayload, responseSchema) {
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest'
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
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
        return response;
      }
    } catch (err) {
      console.warn(`Model ${model} failed, trying next candidate:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model candidates failed.');
}

// --- GRAPH API ENDPOINTS ---

app.get('/api/nodes', (req, res) => {
  res.status(200).json(storedNodes);
});

app.post('/api/nodes', (req, res) => {
  const newNode = req.body;
  const existingIndex = storedNodes.findIndex((n) => n.id === newNode.id);

  if (existingIndex >= 0) {
    storedNodes[existingIndex] = newNode;
  } else {
    storedNodes.push(newNode);
  }

  res.status(201).json(newNode);
});

app.put('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  storedNodes = storedNodes.map((node) => (node.id === id ? { ...node, ...req.body } : node));
  res.status(200).json({ success: true });
});

app.delete('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  storedNodes = storedNodes.filter((node) => node.id !== id);
  res.status(200).json({ success: true });
});

app.get('/api/graph-data', (req, res) => {
  res.json({ success: true, nodes: storedNodes });
});

// --- EXTRACTION PIPELINE ---

app.post('/api/extract-graph', upload.single('file'), async (req, res) => {
  try {
    let contentsPayload = [];
    const promptText = 'Analyze the input thoroughly and extract between 8 to 20 key concepts, components, or entities along with all direct directional relationships between them.';

    // Case 1: Uploaded PDF File
    if (req.file) {
      let extractedPdfText = '';
      try {
        const parsedPdf = await pdfParse(req.file.buffer);
        extractedPdfText = (parsedPdf.text || '').trim();
      } catch (pdfErr) {
        console.warn('pdf-parse text extraction skipped, relying on binary vision parse:', pdfErr.message);
      }

      if (extractedPdfText.length > 50) {
        contentsPayload = [
          `Document Content:\n\n${extractedPdfText.slice(0, 60000)}\n\n${promptText}`
        ];
      } else {
        const mimeType = req.file.mimetype || 'application/pdf';
        const base64Data = req.file.buffer.toString('base64');
        contentsPayload = [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          promptText
        ];
      }
    }
    // Case 2: URL Link Input
    else if (req.body && req.body.url) {
      const targetUrl = req.body.url.trim();

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
        const arrayBuffer = await urlResponse.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);
        
        let pdfText = '';
        try {
          const parsedPdf = await pdfParse(pdfBuffer);
          pdfText = (parsedPdf.text || '').trim();
        } catch (e) {}

        if (pdfText.length > 50) {
          contentsPayload = [`PDF Link Content (${targetUrl}):\n\n${pdfText.slice(0, 60000)}\n\n${promptText}`];
        } else {
          contentsPayload = [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBuffer.toString('base64')
              }
            },
            promptText
          ];
        }
      } else {
        const textHtml = await urlResponse.text();
        const cleanText = textHtml
          .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length > 150) {
          contentsPayload = [
            `Webpage Content from ${targetUrl}:\n\n${cleanText.slice(0, 50000)}\n\n${promptText}`
          ];
        } else {
          // Dynamic Single Page Application fallback
          contentsPayload = [
            `Target Web URL: ${targetUrl}. Extract key core concepts, underlying technologies, architectures, and relationships relevant to this web domain or subject matter.\n\n${promptText}`
          ];
        }
      }
    } else {
      return res.status(400).json({ error: 'Please upload a PDF file or provide a valid URL link.' });
    }

    // Response Schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        concepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Name of the entity or concept' },
              type: { type: Type.STRING, description: 'Category (e.g., ARCHITECTURE, MODEL, MECHANISM, CIRCUIT)' },
              description: { type: Type.STRING, description: 'Short description based on text' }
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
              type: { type: Type.STRING, description: 'Relationship predicate (e.g., uses, contains, improves)' }
            },
            required: ['source', 'target', 'type']
          }
        }
      },
      required: ['concepts', 'relationships']
    };

    // Execute via Model Fallback Chain
    const modelResponse = await generateGraphWithFallback(contentsPayload, responseSchema);
    const graphPayload = JSON.parse(modelResponse.text);

    // Format Nodes
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

    // Format Edges
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
    console.error('PDF/URL Extraction Failure:', err);
    res.status(500).json({ error: 'Failed to process input source', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
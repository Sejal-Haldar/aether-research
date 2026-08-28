import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Multer (Memory Storage) and Gemini API Client
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Baseline default nodes structure matching frontend state
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

// Seed memory storage with the baseline nodes
let storedNodes = [...initialNodes];

// --- EXISTING GRAPH API ENDPOINTS ---

// GET: Send default + newly created nodes back to frontend
app.get('/api/nodes', (req, res) => {
  res.status(200).json(storedNodes);
});

// POST: Add or update a node in memory
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

// PUT: Update an existing node
app.put('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  storedNodes = storedNodes.map((node) => (node.id === id ? { ...node, ...req.body } : node));
  res.status(200).json({ success: true });
});

// DELETE: Remove a node by ID
app.delete('/api/nodes/:id', (req, res) => {
  const { id } = req.params;
  storedNodes = storedNodes.filter((node) => node.id !== id);
  res.status(200).json({ success: true });
});

// Health check endpoint
app.get('/api/graph-data', (req, res) => {
  res.json({ success: true, nodes: storedNodes });
});


// --- NEW AI EXTRACTION PIPELINE ENDPOINT ---

app.post('/api/extract-graph', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided in request.' });
    }

    // 1. Extract raw text from PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Unable to extract text from PDF. The document might be scanned or image-only.' 
      });
    }

    // 2. Define structured JSON output schema for Gemini
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        concepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the entity or concept" },
              type: { type: Type.STRING, description: "Category (e.g., concept, architecture, algorithm, metric)" },
              description: { type: Type.STRING, description: "Short description based on text" }
            },
            required: ["name", "type", "description"]
          }
        },
        relationships: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING, description: "Source concept name" },
              target: { type: Type.STRING, description: "Target concept name" },
              type: { type: Type.STRING, description: "Relationship predicate (e.g., uses, contains, improves)" }
            },
            required: ["source", "target", "type"]
          }
        }
      },
      required: ["concepts", "relationships"]
    };

    // 3. Prompt the model with extracted text
    const prompt = `Analyze the following document text and extract key concepts and relationships between them:\n\n${text.substring(0, 35000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    // 4. Send back structured JSON
    const graphPayload = JSON.parse(response.text);
    res.json(graphPayload);

  } catch (err) {
    console.error('PDF Extraction Failure:', err);
    res.status(500).json({ error: 'Failed to process PDF', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
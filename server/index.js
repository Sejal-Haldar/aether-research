import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Multer disk storage writes uploads directly to disk to avoid server RAM overhead on large files
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max file size limit
});

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

let storedNodes = [...initialNodes];

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

// --- EXTRACTION PIPELINE (LARGE FILES & URL SUPPORT) ---

app.post('/api/extract-graph', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  let uploadedFile = null;

  try {
    let contentsPayload = [];

    // Case 1: PDF File Upload (Large or Small)
    if (req.file) {
      uploadedFile = await ai.files.upload({
        file: req.file.path,
        config: { mimeType: req.file.mimetype || 'application/pdf' }
      });

      contentsPayload = [
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType
          }
        },
        'Analyze the uploaded document and extract key concepts and relationships between them.'
      ];
    } 
    // Case 2: Web URL or Direct PDF Link
    else if (req.body && req.body.url) {
      const targetUrl = req.body.url;
      const urlResponse = await fetch(targetUrl);

      if (!urlResponse.ok) {
        return res.status(400).json({ error: `Failed to fetch URL: ${urlResponse.statusText}` });
      }

      const contentType = urlResponse.headers.get('content-type') || '';

      if (contentType.includes('application/pdf') || targetUrl.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await urlResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        tempFilePath = path.join(os.tmpdir(), `link-${Date.now()}.pdf`);
        fs.writeFileSync(tempFilePath, buffer);

        uploadedFile = await ai.files.upload({
          file: tempFilePath,
          config: { mimeType: 'application/pdf' }
        });

        contentsPayload = [
          {
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType
            }
          },
          'Analyze the document from the link and extract key concepts and relationships between them.'
        ];
      } else {
        const textHtml = await urlResponse.text();
        const cleanText = textHtml
          .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 40000);

        contentsPayload = [
          `Analyze the following webpage content from ${targetUrl} and extract key concepts and relationships between them:\n\n${cleanText}`
        ];
      }
    } else {
      return res.status(400).json({ error: 'Please provide either a PDF file or a URL link.' });
    }

    // Response Schema Definition
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

    // Gemini 3.6 Flash Call
    const modelResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const graphPayload = JSON.parse(modelResponse.text);

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
    console.error('PDF/URL Extraction Failure:', err);
    res.status(500).json({ error: 'Failed to process input source', details: err.message });
  } finally {
    // Disk and Cloud Cleanup
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    if (uploadedFile && uploadedFile.name) {
      try { await ai.files.delete({ name: uploadedFile.name }); } catch (e) {}
    }
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
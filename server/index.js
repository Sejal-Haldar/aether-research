import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
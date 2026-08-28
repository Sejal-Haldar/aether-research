import express from 'express';
import cors from 'cors';

const app = express();
// Dynamic port for Render deployment
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory array to store graph nodes during the active server session
let storedNodes = [];

// GET: Fetch all saved nodes (fixes the 404 error)
app.get('/api/nodes', (req, res) => {
  res.status(200).json(storedNodes);
});

// POST: Save new incoming node payload
app.post('/api/nodes', (req, res) => {
  const newNode = req.body;
  storedNodes.push(newNode);
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
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// GET: Endpoint for initial graph data
app.get('/api/graph-data', (req, res) => {
  res.json({
    success: true,
    workspaces: ['Default Workspace', 'Project Alpha'],
    nodes: [
      { id: '1', label: 'First Node' },
      { id: '2', label: 'Second Node' }
    ]
  });
});

// POST: Endpoint to create a new node
app.post('/api/nodes', (req, res) => {
  const { label, type } = req.body;

  const newNode = {
    id: `node-${Date.now()}`,
    label: label || 'New Backend Node',
    type: type || 'MECHANISM',
    description: 'Created dynamically via Express backend API.',
    tags: ['#custom', '#api']
  };

  res.status(201).json({ success: true, node: newNode });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
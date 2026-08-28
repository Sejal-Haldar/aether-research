import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Backend endpoint for graph data
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

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
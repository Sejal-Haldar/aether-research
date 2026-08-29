import { 
  ResearchAnalysisData, 
  GraphNodeData, 
  NodeCategory 
} from '../types/graph';

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
}

export function buildResearchGraph(
  rootId: string,
  rootTitle: string,
  analysis: ResearchAnalysisData
): { nodes: GraphNodeData[]; edges: GraphEdgeData[] } {
  const nodes: GraphNodeData[] = [];
  const edges: GraphEdgeData[] = [];
  const nodeMap = new Map<string, string>();

  // Root Node
  const sanitizedRootId = `root-${rootId}`;
  nodes.push({
    id: sanitizedRootId,
    title: rootTitle,
    category: 'MECHANISM',
    description: analysis.summary?.short || '',
    tags: ['#root', '#source'],
    status: 'Verified',
    x: 250,
    y: 180,
    badge: 'SOURCE'
  });

  // Entity Nodes
  (analysis.entities || []).forEach((entity, index) => {
    const normalizedKey = entity.name.toLowerCase().trim();
    if (!nodeMap.has(normalizedKey)) {
      const entityId = entity.id || `entity-${index}-${Date.now()}`;
      nodeMap.set(normalizedKey, entityId);
      
      const rawCat = (entity.category?.toUpperCase() || 'MECHANISM') as NodeCategory;

      nodes.push({
        id: entityId,
        title: entity.name,
        category: rawCat,
        description: entity.description || '',
        tags: [entity.category || 'extracted'],
        status: 'Verified',
        x: 250 + (index % 3) * 260,
        y: 180 + Math.floor(index / 3) * 160,
        badge: rawCat
      });

      edges.push({
        id: `edge-${sanitizedRootId}-${entityId}`,
        source: sanitizedRootId,
        target: entityId,
        label: 'contains concept'
      });
    }
  });

  // Conceptual Relationships
  (analysis.relationships || []).forEach((rel) => {
    const sourceNodeId = findNodeId(rel.sourceId, nodeMap, nodes);
    const targetNodeId = findNodeId(rel.targetId, nodeMap, nodes);

    if (sourceNodeId && targetNodeId && sourceNodeId !== targetNodeId) {
      edges.push({
        id: `rel-${sourceNodeId}-${targetNodeId}`,
        source: sourceNodeId,
        target: targetNodeId,
        label: rel.relation
      });
    }
  });

  return { nodes, edges };
}

function findNodeId(
  idOrName: string, 
  map: Map<string, string>, 
  nodes: GraphNodeData[]
): string | null {
  if (!idOrName) return null;
  const directKey = idOrName.toLowerCase().trim();
  if (map.has(directKey)) return map.get(directKey)!;
  
  const found = nodes.find(n => n.id === idOrName || n.title.toLowerCase() === directKey);
  return found ? found.id : null;
}
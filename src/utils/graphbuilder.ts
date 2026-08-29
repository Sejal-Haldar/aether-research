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

const VALID_CATEGORIES: NodeCategory[] = ['MODEL', 'ARCHITECTURE', 'MECHANISM', 'DATASET', 'METRIC'];

function normalizeCategory(raw?: string): NodeCategory {
  const upper = (raw || '').toUpperCase().trim();
  return (VALID_CATEGORIES as string[]).includes(upper) ? (upper as NodeCategory) : 'MECHANISM';
}

// Packs the parts of ResearchAnalysisData that don't have dedicated graph
// nodes (summary, key takeaways, structured notes, flowchart) into the
// root/source node's existing `notes` field, so they're visible via the
// already-existing Research Notes panel (NodeNotes.tsx) without requiring
// any new UI.
function buildRootNotes(analysis: ResearchAnalysisData): GraphNodeData['notes'] {
  const notes: NonNullable<GraphNodeData['notes']> = [];
  const now = new Date().toISOString();

  if (analysis.summary) {
    const takeaways = analysis.summary.keyTakeaways?.length
      ? '\n\nKey takeaways:\n' + analysis.summary.keyTakeaways.map((t) => `• ${t}`).join('\n')
      : '';
    notes.push({
      id: `note-summary-${Date.now()}`,
      author: 'AI Analysis — Summary',
      content: `${analysis.summary.short}${analysis.summary.detailed ? `\n\n${analysis.summary.detailed}` : ''}${takeaways}`,
      createdAt: now
    });
  }

  (analysis.notes || []).forEach((section, i) => {
    const bullets = section.bullets?.length ? section.bullets.map((b) => `• ${b}`).join('\n') : '';
    const defs = section.definitions?.length
      ? '\n\nDefinitions:\n' + section.definitions.map((d) => `${d.term}: ${d.definition}`).join('\n')
      : '';
    const formulas = section.formulasOrConcepts?.length
      ? '\n\n' + section.formulasOrConcepts.join('\n')
      : '';
    notes.push({
      id: `note-section-${i}-${Date.now()}`,
      author: `AI Analysis — ${section.heading}`,
      content: `${bullets}${defs}${formulas}`,
      createdAt: now
    });
  });

  if (analysis.flowchart && analysis.flowchart.length > 0) {
    const steps = [...analysis.flowchart]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((s) => `${s.stepNumber}. [${s.type}] ${s.label}${s.nextSteps?.length ? ` → ${s.nextSteps.join(', ')}` : ''}`)
      .join('\n');
    notes.push({
      id: `note-flowchart-${Date.now()}`,
      author: 'AI Analysis — Process / Flowchart',
      content: steps,
      createdAt: now
    });
  }

  return notes;
}

export function buildResearchGraph(
  rootId: string,
  rootTitle: string,
  analysis: ResearchAnalysisData
): { nodes: GraphNodeData[]; edges: GraphEdgeData[] } {
  const nodes: GraphNodeData[] = [];
  const edges: GraphEdgeData[] = [];
  const nodeMap = new Map<string, string>();

  // Root Node — represents the source document itself, preserved so
  // extracted concepts can always be traced back to what they came from.
  const sanitizedRootId = `root-${rootId}`;
  nodes.push({
    id: sanitizedRootId,
    title: analysis.title || rootTitle,
    category: 'MECHANISM',
    description: analysis.summary?.short || '',
    tags: ['#root', '#source'],
    status: 'Verified',
    x: 250,
    y: 180,
    badge: 'SOURCE',
    glow: true,
    notes: buildRootNotes(analysis)
  });

  // Entity Nodes
  (analysis.entities || []).forEach((entity, index) => {
    const normalizedKey = entity.name.toLowerCase().trim();
    if (!normalizedKey || nodeMap.has(normalizedKey)) return;

    const entityId = entity.id || `entity-${index}-${Date.now()}`;
    nodeMap.set(normalizedKey, entityId);

    const category = normalizeCategory(entity.category);

    nodes.push({
      id: entityId,
      title: entity.name,
      category,
      description: entity.description || '',
      tags: [entity.category || 'extracted', 'ai-extracted'],
      status: 'Verified',
      x: 250 + (index % 3) * 260,
      y: 180 + Math.floor(index / 3) * 160,
      badge: category
    });

    edges.push({
      id: `edge-${sanitizedRootId}-${entityId}`,
      source: sanitizedRootId,
      target: entityId,
      label: 'contains concept'
    });
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
export type NodeCategory = 'MODEL' | 'ARCHITECTURE' | 'MECHANISM' | 'DATASET' | 'METRIC';

export interface GraphNodeData {
  id: string;
  title: string;
  category: NodeCategory;
  description: string;
  tags: string[];
  x: number;
  y: number;
  badge?: string;
  glow?: boolean;
  status?: 'Verified' | 'Experimental' | 'Draft' | 'Deprecated';
  source?: {
    title: string;
    citation: string;
    url?: string;
    year?: number;
  };
  mechanics?: {
    id: string;
    title: string;
    description: string;
    targetNodeId?: string;
  }[];
  complexityMatrix?: {
    timeComplexity?: string;
    parallelizable?: 'High' | 'Medium' | 'Low';
    parameters?: string;
    type?: string;
    memoryFootprint?: string;
  };
  notes?: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
}

export interface GraphEdgeData {
  id: string;
  source: string; // source node id
  target: string; // target node id
  label: string;  // inline badge e.g. 'implemented_by', 'utilizes', 'derives_from'
  type?: 'solid' | 'dashed' | 'glowing';
  active?: boolean;
}

export interface WorkspaceData {
  id: string;
  name: string;
  domain: string;
  nodeCount: number;
  edgeCount: number;
  lastUpdated: string;
  icon?: string;
}

export interface GraphInsight {
  id: string;
  type: 'signal' | 'gap' | 'recommendation';
  title: string;
  description: string;
  actionText?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
}

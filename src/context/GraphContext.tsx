import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { GraphNodeData, GraphEdgeData, WorkspaceData, GraphInsight, NodeCategory } from '../types/graph';
import { INITIAL_NODES, INITIAL_EDGES, INITIAL_WORKSPACES, INITIAL_INSIGHTS } from '../data/initialGraphData';

interface GraphContextType {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId: string | null;
  selectedNode: GraphNodeData | undefined;
  activeWorkspace: WorkspaceData;
  workspaces: WorkspaceData[];
  insights: GraphInsight[];
  searchQuery: string;
  categoryFilter: NodeCategory | 'ALL';
  zoom: number;
  pan: { x: number; y: number };
  isCommandPaletteOpen: boolean;
  isAddNodeModalOpen: boolean;
  isNewWorkspaceModalOpen: boolean;
  isAddNoteModalOpen: boolean;
  isInsightsDrawerOpen: boolean;
  showGrid: boolean;
  layoutMode: 'free' | 'hierarchical' | 'radial';
  activeNavTab: string;

  // Actions
  setSelectedNodeId: (id: string | null) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  addNode: (node: Partial<GraphNodeData> & { title: string; category: NodeCategory; description: string; connectToNodeId?: string; edgeLabel?: string }) => string;
  deleteNode: (id: string) => void;
  addEdge: (sourceId: string, targetId: string, label?: string) => void;
  deleteEdge: (id: string) => void;
  addNoteToNode: (nodeId: string, content: string, author?: string) => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (cat: NodeCategory | 'ALL') => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToView: () => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsAddNodeModalOpen: (open: boolean) => void;
  setIsNewWorkspaceModalOpen: (open: boolean) => void;
  setIsAddNoteModalOpen: (open: boolean) => void;
  setIsInsightsDrawerOpen: (open: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setActiveNavTab: (tab: string) => void;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, domain: string) => void;
  applyLayout: (mode: 'free' | 'hierarchical' | 'radial') => void;
  resolveInsight: (insightId: string) => void;
  exportGraphJSON: () => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const GraphProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-llm');
  const [nodes, setNodes] = useState<GraphNodeData[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdgeData[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-transformers');
  const [insights, setInsights] = useState<GraphInsight[]>(INITIAL_INSIGHTS);
  
  // Navigation & Filtering
  const [activeNavTab, setActiveNavTab] = useState<string>('Explore Graph');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<NodeCategory | 'ALL'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'free' | 'hierarchical' | 'radial'>('free');

  // Canvas Transform
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Modals & Panels
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState<boolean>(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState<boolean>(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);
  const [isInsightsDrawerOpen, setIsInsightsDrawerOpen] = useState<boolean>(false);

  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  }, [workspaces, activeWorkspaceId]);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // Node position updater
  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => node.id === id ? { ...node, x, y } : node));
  }, []);

  // Add Node
  const addNode = useCallback((data: Partial<GraphNodeData> & { title: string; category: NodeCategory; description: string; connectToNodeId?: string; edgeLabel?: string }): string => {
    const newId = `node-${Date.now()}`;
    const newNode: GraphNodeData = {
      id: newId,
      title: data.title,
      category: data.category,
      badge: data.badge || data.category,
      description: data.description,
      tags: data.tags || ['RESEARCH', data.category],
      x: data.x ?? (Math.floor(Math.random() * 300) + 150),
      y: data.y ?? (Math.floor(Math.random() * 200) + 150),
      glow: data.glow ?? false,
      status: data.status || 'Verified',
      source: data.source,
      mechanics: data.mechanics || [],
      complexityMatrix: data.complexityMatrix || {
        timeComplexity: 'O(n · d)',
        parallelizable: 'High',
        parameters: 'Dynamic',
        type: 'Modular Block'
      },
      notes: data.notes || []
    };

    setNodes(prev => [...prev, newNode]);

    // Add connection if requested
    if (data.connectToNodeId) {
      const newEdge: GraphEdgeData = {
        id: `edge-${newId}-${data.connectToNodeId}`,
        source: newId,
        target: data.connectToNodeId,
        label: data.edgeLabel || 'relates_to',
        type: 'solid',
        active: false
      };
      setEdges(prev => [...prev, newEdge]);
    }

    setSelectedNodeId(newId);
    return newId;
  }, []);

  // Delete Node
  const deleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  // Add Edge
  const addEdge = useCallback((sourceId: string, targetId: string, label: string = 'connects_to') => {
    const existing = edges.find(e => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId));
    if (existing) return;

    const newEdge: GraphEdgeData = {
      id: `edge-${sourceId}-${targetId}-${Date.now()}`,
      source: sourceId,
      target: targetId,
      label,
      type: 'solid',
      active: true
    };
    setEdges(prev => [...prev, newEdge]);
  }, [edges]);

  // Delete Edge
  const deleteEdge = useCallback((id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  }, []);

  // Add Note to Node
  const addNoteToNode = useCallback((nodeId: string, content: string, author: string = 'Aether Architect') => {
    const newNote = {
      id: `note-${Date.now()}`,
      author,
      content,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          notes: [...(node.notes || []), newNote]
        };
      }
      return node;
    }));
  }, []);

  // Zoom Controls
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.15, 2.5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.15, 0.4));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToView = useCallback(() => {
    if (nodes.length === 0) {
      resetView();
      return;
    }
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + 240));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + 140));

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 100;

    const scaleX = (window.innerWidth - 600) / (width + padding * 2);
    const scaleY = (window.innerHeight - 150) / (height + padding * 2);
    const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.2);

    setZoom(fitZoom);
    setPan({
      x: 50 - minX * fitZoom,
      y: 50 - minY * fitZoom
    });
  }, [nodes, resetView]);

  // Layout Algorithms
  const applyLayout = useCallback((mode: 'free' | 'hierarchical' | 'radial') => {
    setLayoutMode(mode);
    if (mode === 'hierarchical') {
      // Clean tree layout
      const levels: { [key: string]: number } = {
        'node-bert': 0,
        'node-roberta': 0,
        'node-transformers': 1,
        'node-self-attention': 2,
        'node-positional-encoding': 2
      };
      setNodes(prev => prev.map((node, i) => {
        const lvl = levels[node.id] ?? (i % 3);
        const colIndex = i % 2;
        return {
          ...node,
          x: 80 + lvl * 280,
          y: 80 + colIndex * 240
        };
      }));
    } else if (mode === 'radial') {
      const centerX = 380;
      const centerY = 260;
      const radius = 240;
      setNodes(prev => prev.map((node, index) => {
        if (node.id === 'node-transformers') {
          return { ...node, x: centerX - 100, y: centerY - 60 };
        }
        const angle = ((index - 1) / (prev.length - 1)) * 2 * Math.PI;
        return {
          ...node,
          x: Math.round(centerX + radius * Math.cos(angle) - 100),
          y: Math.round(centerY + radius * Math.sin(angle) - 60)
        };
      }));
    }
  }, []);

  // Workspaces
  const switchWorkspace = useCallback((workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
  }, []);

  const createWorkspace = useCallback((name: string, domain: string) => {
    const newWs: WorkspaceData = {
      id: `ws-${Date.now()}`,
      name,
      domain,
      nodeCount: 1,
      edgeCount: 0,
      lastUpdated: 'Just now',
      icon: 'Folder'
    };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
  }, []);

  // Resolve Insight
  const resolveInsight = useCallback((insightId: string) => {
    const targetInsight = insights.find(i => i.id === insightId);
    if (!targetInsight) return;

    if (targetInsight.sourceNodeId && targetInsight.targetNodeId) {
      addEdge(targetInsight.sourceNodeId, targetInsight.targetNodeId, 'bridges_to');
    } else if (targetInsight.targetNodeId) {
      setSelectedNodeId(targetInsight.targetNodeId);
      setIsAddNoteModalOpen(true);
    }
    setInsights(prev => prev.filter(i => i.id !== insightId));
  }, [insights, addEdge]);

  // Export
  const exportGraphJSON = useCallback(() => {
    const data = {
      workspace: activeWorkspace,
      nodes,
      edges,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorkspace.name.toLowerCase().replace(/\s+/g, '-')}-graph.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeWorkspace, nodes, edges]);

  // Sync workspace node & edge count
  useEffect(() => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          lastUpdated: 'Just now'
        };
      }
      return w;
    }));
  }, [nodes.length, edges.length, activeWorkspaceId]);

  return (
    <GraphContext.Provider
      value={{
        nodes,
        edges,
        selectedNodeId,
        selectedNode,
        activeWorkspace,
        workspaces,
        insights,
        searchQuery,
        categoryFilter,
        zoom,
        pan,
        isCommandPaletteOpen,
        isAddNodeModalOpen,
        isNewWorkspaceModalOpen,
        isAddNoteModalOpen,
        isInsightsDrawerOpen,
        showGrid,
        layoutMode,
        activeNavTab,
        setSelectedNodeId,
        updateNodePosition,
        addNode,
        deleteNode,
        addEdge,
        deleteEdge,
        addNoteToNode,
        setSearchQuery,
        setCategoryFilter,
        setZoom,
        setPan,
        zoomIn,
        zoomOut,
        resetView,
        fitToView,
        setIsCommandPaletteOpen,
        setIsAddNodeModalOpen,
        setIsNewWorkspaceModalOpen,
        setIsAddNoteModalOpen,
        setIsInsightsDrawerOpen,
        setShowGrid,
        setActiveNavTab,
        switchWorkspace,
        createWorkspace,
        applyLayout,
        resolveInsight,
        exportGraphJSON
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
};

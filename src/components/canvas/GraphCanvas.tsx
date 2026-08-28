import React, { useMemo } from 'react';
import { useGraph } from '../../context/GraphContext';
import { useGraphCanvas } from '../../hooks/useGraphCanvas';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { ViewportControls } from './ViewportControls';

export const GraphCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    updateNodePosition,
    searchQuery,
    categoryFilter,
    zoom,
    pan,
    setPan,
    setZoom,
    showGrid
  } = useGraph();

  const {
    containerRef,
    isPanning,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeDragStart
  } = useGraphCanvas({
    zoom,
    pan,
    setPan,
    setZoom,
    updateNodePosition
  });

  // Calculate connected node IDs for focus highlight
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>([selectedNodeId]);
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) ids.add(edge.target);
      if (edge.target === selectedNodeId) ids.add(edge.source);
    });
    return ids;
  }, [selectedNodeId, edges]);

  // Search filter results
  const matchingSearchNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();
    nodes.forEach((node) => {
      const matchTitle = node.title.toLowerCase().includes(q);
      const matchDesc = node.description.toLowerCase().includes(q);
      const matchTag = node.tags.some(t => t.toLowerCase().includes(q));
      const matchCat = node.category.toLowerCase().includes(q);
      if (matchTitle || matchDesc || matchTag || matchCat) {
        matches.add(node.id);
      }
    });
    return matches;
  }, [nodes, searchQuery]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`flex-1 h-full relative overflow-hidden bg-[#090A0E] select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      } ${showGrid ? 'canvas-grid' : ''}`}
    >
      {/* Floating Viewport Controls */}
      <ViewportControls />

      {/* Transformed Graph Container (Pan & Zoom) */}
      <div
        className="w-full h-full absolute top-0 left-0 origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Vector SVG Edge Layer */}
        <svg
          className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible z-0"
        >
          <defs>
            {/* Cyan Glow Filter */}
            <filter id="cyanGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cyan Arrowhead Marker */}
            <marker
              id="arrowhead-cyan"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#06B6D4" />
            </marker>

            {/* Slate Arrowhead Marker */}
            <marker
              id="arrowhead-slate"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            const isEdgeSelected =
              selectedNodeId !== null &&
              (edge.source === selectedNodeId || edge.target === selectedNodeId);

            const isDimmed =
              selectedNodeId !== null && !isEdgeSelected;

            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isSelected={isEdgeSelected}
                isDimmed={isDimmed}
              />
            );
          })}
        </svg>

        {/* Nodes Layer */}
        <div className="relative w-full h-full z-10 pointer-events-auto">
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isMatchedSearch = matchingSearchNodeIds !== null && matchingSearchNodeIds.has(node.id);
            
            // Dimming logic
            let isDimmed = false;
            if (categoryFilter !== 'ALL' && node.category !== categoryFilter) {
              isDimmed = true;
            } else if (matchingSearchNodeIds !== null && !isMatchedSearch) {
              isDimmed = true;
            } else if (selectedNodeId !== null && !connectedNodeIds.has(node.id)) {
              isDimmed = true;
            }

            return (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={isSelected}
                isMatchedSearch={isMatchedSearch}
                isDimmed={isDimmed}
                onSelect={(id) => setSelectedNodeId(id)}
                onDragStart={handleNodeDragStart}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

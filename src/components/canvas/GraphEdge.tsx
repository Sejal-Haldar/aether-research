import React from 'react';
import { GraphEdgeData, GraphNodeData } from '../../types/graph';

interface GraphEdgeProps {
  edge: GraphEdgeData;
  sourceNode?: GraphNodeData;
  targetNode?: GraphNodeData;
  isSelected: boolean;
  isDimmed: boolean;
}

export const GraphEdge: React.FC<GraphEdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  isDimmed
}) => {
  if (!sourceNode || !targetNode) return null;

  // Node dimensions: width 256px, approx height 130px
  const nodeWidth = 256;
  const nodeHeight = 130;

  const sourceCenterX = sourceNode.x + nodeWidth / 2;
  const sourceCenterY = sourceNode.y + nodeHeight / 2;
  const targetCenterX = targetNode.x + nodeWidth / 2;
  const targetCenterY = targetNode.y + nodeHeight / 2;

  // Determine connecting points based on relative position
  let startX = sourceCenterX;
  let startY = sourceCenterY;
  let endX = targetCenterX;
  let endY = targetCenterY;

  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;

  // If mostly horizontal displacement
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      startX = sourceNode.x + nodeWidth;
      endX = targetNode.x;
    } else {
      startX = sourceNode.x;
      endX = targetNode.x + nodeWidth;
    }
  } else {
    // Mostly vertical displacement
    if (dy > 0) {
      startY = sourceNode.y + nodeHeight;
      endY = targetNode.y;
    } else {
      startY = sourceNode.y;
      endY = targetNode.y + nodeHeight;
    }
  }

  // Calculate Bezier control points
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  
  let cp1X = startX + deltaX * 0.5;
  let cp1Y = startY;
  let cp2X = startX + deltaX * 0.5;
  let cp2Y = endY;

  // If vertical connection
  if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
    cp1X = startX;
    cp1Y = startY + deltaY * 0.5;
    cp2X = endX;
    cp2Y = startY + deltaY * 0.5;
  }

  const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  // Calculate curve midpoint for label badge
  const midX = (startX + 2 * cp1X + 2 * cp2X + endX) / 6;
  const midY = (startY + 2 * cp1Y + 2 * cp2Y + endY) / 6;

  const isHighlighted = isSelected || edge.active || edge.type === 'glowing';

  return (
    <g className={`transition-opacity duration-200 ${isDimmed ? 'opacity-20' : 'opacity-100'}`}>
      {/* Background glow path */}
      {isHighlighted && (
        <path
          d={pathD}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="6"
          strokeOpacity="0.25"
          filter="url(#cyanGlowFilter)"
        />
      )}

      {/* Main vector line path */}
      <path
        d={pathD}
        fill="none"
        stroke={isHighlighted ? '#06B6D4' : '#334155'}
        strokeWidth={isHighlighted ? '2.5' : '1.5'}
        strokeDasharray={edge.type === 'dashed' ? '5 5' : isHighlighted ? '6 4' : 'none'}
        className={isHighlighted ? 'animate-edge-flow' : ''}
        markerEnd={isHighlighted ? 'url(#arrowhead-cyan)' : 'url(#arrowhead-slate)'}
      />

      {/* Edge label badge pill */}
      {edge.label && (
        <foreignObject
          x={midX - 55}
          y={midY - 12}
          width="110"
          height="24"
          className="overflow-visible pointer-events-none"
        >
          <div className="flex items-center justify-center">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight shadow-md border backdrop-blur-md transition-colors ${
                isHighlighted
                  ? 'bg-[#0B132B]/95 text-cyan-300 border-cyan-500/60 shadow-cyan-glow-sm font-semibold'
                  : 'bg-[#0E1118]/90 text-slate-400 border-slate-700/60'
              }`}
            >
              {edge.label}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

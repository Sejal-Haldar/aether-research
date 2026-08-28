import React from 'react';
import { 
  Cpu, 
  Layers, 
  GitCommit, 
  Database, 
  BarChart3, 
  GripHorizontal
} from 'lucide-react';
import { GraphNodeData } from '../../types/graph';

interface GraphNodeProps {
  node: GraphNodeData;
  isSelected: boolean;
  isMatchedSearch: boolean;
  isDimmed: boolean;
  onSelect: (nodeId: string) => void;
  onDragStart: (nodeId: string, nodeX: number, nodeY: number, e: React.MouseEvent) => void;
}

export const GraphNode: React.FC<GraphNodeProps> = ({
  node,
  isSelected,
  isMatchedSearch,
  isDimmed,
  onSelect,
  onDragStart
}) => {
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'MODEL':
        return {
          badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
          icon: Cpu,
          dotColor: 'bg-emerald-400'
        };
      case 'ARCHITECTURE':
        return {
          badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60',
          icon: Layers,
          dotColor: 'bg-cyan-400'
        };
      case 'MECHANISM':
        return {
          badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60',
          icon: GitCommit,
          dotColor: 'bg-indigo-400'
        };
      case 'DATASET':
        return {
          badge: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
          icon: Database,
          dotColor: 'bg-amber-400'
        };
      case 'METRIC':
      default:
        return {
          badge: 'bg-rose-950/70 text-rose-300 border-rose-700/60',
          icon: BarChart3,
          dotColor: 'bg-rose-400'
        };
    }
  };

  const { badge, icon: CategoryIcon, dotColor } = getCategoryStyles(node.category);

  // Special styling for Transformers or glowing nodes
  const isTransformersNode = node.id === 'node-transformers' || node.glow;

  return (
    <div
      id={node.id}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={`graph-node absolute top-0 left-0 w-64 rounded-xl cursor-pointer transition-shadow select-none ${
        isDimmed ? 'opacity-30 filter grayscale' : 'opacity-100'
      } ${
        isSelected
          ? 'ring-2 ring-cyan-400 border-cyan-400 bg-[#0F131D] shadow-[0_0_25px_rgba(6,182,212,0.35)] z-30'
          : isTransformersNode
          ? 'border border-cyan-500/80 bg-[#10141F] shadow-[0_0_15px_rgba(6,182,212,0.18)] hover:border-cyan-400 z-20'
          : 'border border-slate-800/90 bg-[#0E1118] hover:border-slate-700 hover:bg-[#121622] shadow-panel z-10'
      }`}
    >
      {/* Node Header & Drag Bar */}
      <div 
        onMouseDown={(e) => onDragStart(node.id, node.x, node.y, e)}
        className="p-3 pb-2 flex items-center justify-between border-b border-slate-800/60 cursor-grab active:cursor-grabbing group/drag"
      >
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border flex items-center gap-1 ${badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {node.badge || node.category}
          </span>
          {isMatchedSearch && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/40">
              Match
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 group-hover/drag:text-cyan-400 transition-colors">
          {isSelected && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
          )}
          <GripHorizontal className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Node Body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className={`text-sm font-bold tracking-tight ${isSelected || isTransformersNode ? 'text-white' : 'text-slate-100'}`}>
            {node.title}
          </h3>
          <CategoryIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {node.description}
        </p>

        {/* Tags & Metadata */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/50">
          {node.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/40"
            >
              #{tag}
            </span>
          ))}
          {node.tags.length > 3 && (
            <span className="text-[9px] font-mono text-slate-500">
              +{node.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

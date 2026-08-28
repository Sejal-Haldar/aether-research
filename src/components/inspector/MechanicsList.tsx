import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

interface MechanicsListProps {
  mechanics?: {
    id: string;
    title: string;
    description: string;
    targetNodeId?: string;
  }[];
}

export const MechanicsList: React.FC<MechanicsListProps> = ({ mechanics }) => {
  const { setSelectedNodeId, nodes, setPan, zoom } = useGraph();

  if (!mechanics || mechanics.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-[#12151E]/60 border border-slate-800/60 text-center">
        <p className="text-xs text-slate-500 italic">No sub-mechanics registered for this node.</p>
      </div>
    );
  }

  const handleMechanicClick = (targetNodeId?: string) => {
    if (!targetNodeId) return;
    const target = nodes.find(n => n.id === targetNodeId);
    if (target) {
      setSelectedNodeId(targetNodeId);
      // Smoothly pan towards the target node
      setPan({
        x: Math.round(200 - target.x * zoom),
        y: Math.round(150 - target.y * zoom)
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {mechanics.map((item) => {
        const isClickable = !!item.targetNodeId;

        return (
          <div
            key={item.id}
            onClick={() => isClickable && handleMechanicClick(item.targetNodeId)}
            className={`p-2.5 rounded-lg bg-[#12151E] border border-slate-800/80 transition-all ${
              isClickable
                ? 'hover:border-cyan-500/50 hover:bg-[#161B26] cursor-pointer group'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h4>
              </div>
              {isClickable && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed pl-3.5">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

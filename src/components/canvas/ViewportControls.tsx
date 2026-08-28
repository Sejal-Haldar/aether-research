import React from 'react';
import { 
  Plus, 
  Minus, 
  Maximize2, 
  RotateCcw, 
  Grid
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const ViewportControls: React.FC = () => {
  const { 
    zoom, 
    zoomIn, 
    zoomOut, 
    fitToView, 
    resetView, 
    showGrid, 
    setShowGrid 
  } = useGraph();

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="viewport-controls absolute top-4 left-6 z-20 flex items-center gap-1 p-1 bg-[#0D0F14]/90 backdrop-blur-md border border-slate-800/80 rounded-lg shadow-panel select-none">
      {/* Zoom In */}
      <button
        onClick={zoomIn}
        className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
        title="Zoom In (+)"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
        title="Zoom Out (-)"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

      {/* Zoom % display */}
      <span className="px-2 text-[10px] font-mono text-slate-400 min-w-[42px] text-center">
        {zoomPercentage}%
      </span>

      <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

      {/* Fit View */}
      <button
        onClick={fitToView}
        className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
        title="Fit All Nodes in View"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Reset 100% */}
      <button
        onClick={resetView}
        className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
        title="Reset Zoom & Pan (0)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Toggle Grid */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={`p-1.5 rounded transition-colors ${
          showGrid 
            ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
        }`}
        title="Toggle Canvas Grid"
      >
        <Grid className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

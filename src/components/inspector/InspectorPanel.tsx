import React from 'react';
import { 
  ExternalLink, 
  Share2, 
  Plus, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  Trash2,
  Edit3
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';
import { MechanicsList } from './MechanicsList';
import { NodeNotes } from './NodeNotes';

export const InspectorPanel: React.FC = () => {
  const { 
    selectedNode, 
    setIsAddNoteModalOpen, 
    openNodeEditor,
    deleteNode, 
    setSelectedNodeId, 
    fitToView,
    addEdge,
    nodes
  } = useGraph();

  if (!selectedNode) {
    return (
      <aside className="w-80 bg-[#0D0F14] border-l border-slate-800/80 flex flex-col justify-between p-5 z-20 flex-shrink-0 select-none">
        <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-4 text-slate-500">
          <div className="w-12 h-12 rounded-xl bg-[#12151E] border border-slate-800 flex items-center justify-center text-cyan-400/60">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300">No Concept Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
              Click any node in the graph viewport to inspect its architectural specs, mechanics, and citations. Double-click to edit.
            </p>
          </div>
          <button
            onClick={() => setSelectedNodeId('node-transformers')}
            className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 hover:bg-cyan-900/40 rounded-md text-xs font-medium transition-colors"
          >
            Select Transformers
          </button>
        </div>
      </aside>
    );
  }

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'MODEL':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
      case 'ARCHITECTURE':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
      case 'MECHANISM':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60';
      case 'DATASET':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      case 'METRIC':
      default:
        return 'bg-rose-950/70 text-rose-300 border-rose-700/60';
    }
  };

  const handleExploreConnections = () => {
    const otherNodes = nodes.filter(n => n.id !== selectedNode.id);
    if (otherNodes.length > 0) {
      const randomTarget = otherNodes[Math.floor(Math.random() * otherNodes.length)];
      addEdge(selectedNode.id, randomTarget.id, 'correlates_with');
    }
    fitToView();
  };

  return (
    <aside className="w-80 bg-[#0D0F14] border-l border-slate-800/80 flex flex-col justify-between p-5 z-20 flex-shrink-0 overflow-y-auto custom-scrollbar select-none">
      {/* Top Header Section */}
      <div className="flex flex-col gap-5">
        {/* Category Badge & Actions */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${getCategoryBadgeClass(selectedNode.category)}`}>
            {selectedNode.badge || `${selectedNode.category} NODE`}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-2.5 h-2.5" />
              {selectedNode.status || 'Verified'}
            </span>

            {/* Quick Edit Node Button */}
            <button
              onClick={() => openNodeEditor(selectedNode.id)}
              className="text-slate-400 hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Edit Node (or double-click node on canvas)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Delete node from graph"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Tag Chips */}
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center justify-between">
            {selectedNode.title}
          </h2>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedNode.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800/80 text-cyan-400/90 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Paragraph Body */}
        <div className="text-xs text-slate-300 leading-relaxed bg-[#12151E]/40 p-3 rounded-lg border border-slate-800/60">
          <p>{selectedNode.description}</p>
        </div>

        {/* Source Reference Card */}
        {selectedNode.source && (
          <div className="p-3 rounded-lg bg-[#12151E] border border-slate-800/90 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-cyan-400" />
                SOURCE REFERENCE
              </span>
              {selectedNode.source.year && (
                <span className="text-slate-500">{selectedNode.source.year}</span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-200">
              "{selectedNode.source.title}"
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              {selectedNode.source.citation}
            </p>
            {(selectedNode.doi || selectedNode.source.doi) && (
              <p className="text-[10px] text-cyan-400/80 font-mono">
                DOI: {selectedNode.doi || selectedNode.source.doi}
              </p>
            )}
            {selectedNode.source.url && (
              <a
                href={selectedNode.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View Paper / ArXiv</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}

        {/* Core Mechanics Stack */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              CORE MECHANICS STACK
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {selectedNode.mechanics?.length || 0} Modules
            </span>
          </div>
          <MechanicsList mechanics={selectedNode.mechanics} />
        </div>

        {/* Metadata Complexity Matrix */}
        {selectedNode.complexityMatrix && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              COMPLEXITY & HARDWARE MATRIX
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-[#12151E] border border-slate-800/80">
                <p className="text-[9px] font-mono text-slate-500 uppercase">COMPLEXITY</p>
                <p className="font-mono font-semibold text-cyan-400 mt-0.5">
                  {selectedNode.complexityMatrix.timeComplexity || 'O(n² · d)'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12151E] border border-slate-800/80">
                <p className="text-[9px] font-mono text-slate-500 uppercase">PARALLELIZABLE</p>
                <p className="font-mono font-semibold text-emerald-400 mt-0.5">
                  {selectedNode.complexityMatrix.parallelizable || 'High'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12151E] border border-slate-800/80">
                <p className="text-[9px] font-mono text-slate-500 uppercase">PARAMETERS</p>
                <p className="font-mono font-semibold text-slate-200 mt-0.5 truncate">
                  {selectedNode.complexityMatrix.parameters || 'Variable'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12151E] border border-slate-800/80">
                <p className="text-[9px] font-mono text-slate-500 uppercase">TYPE</p>
                <p className="font-mono font-semibold text-slate-200 mt-0.5 truncate">
                  {selectedNode.complexityMatrix.type || 'Standard'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Research Notes & Annotations */}
        <NodeNotes notes={selectedNode.notes} />
      </div>

      {/* Sticky Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
        {/* Primary Action: Explore Connections */}
        <button
          onClick={handleExploreConnections}
          className="w-full py-2 bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/40 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm group"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span>Explore Connections</span>
        </button>

        {/* Secondary Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (selectedNode.source?.url) {
                window.open(selectedNode.source.url, '_blank');
              } else {
                alert(`Opening research sources for: ${selectedNode.title}`);
              }
            }}
            className="py-1.5 bg-[#12151E] border border-slate-700/60 hover:bg-slate-800 text-slate-300 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-slate-400" />
            <span>Open Sources</span>
          </button>

          <button
            onClick={() => setIsAddNoteModalOpen(true)}
            className="py-1.5 bg-[#12151E] border border-slate-700/60 hover:bg-slate-800 text-cyan-400 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>+ Add Note</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { useGraph } from '../../context/GraphContext';
import { NodeCategory } from '../../types/graph';

export const AddNodeModal: React.FC = () => {
  const { 
    isAddNodeModalOpen, 
    setIsAddNodeModalOpen, 
    addNode, 
    nodes 
  } = useGraph();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NodeCategory>('MODEL');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [connectToNodeId, setConnectToNodeId] = useState<string>('');
  const [edgeLabel, setEdgeLabel] = useState('utilizes');
  const [timeComplexity, setTimeComplexity] = useState('O(n · d)');

  if (!isAddNodeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const parsedTags = tags
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    addNode({
      title: title.trim(),
      category,
      badge: category,
      description: description.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['AI', category],
      connectToNodeId: connectToNodeId || undefined,
      edgeLabel: edgeLabel || 'relates_to',
      complexityMatrix: {
        timeComplexity: timeComplexity.trim() || 'O(n · d)',
        parallelizable: 'High',
        parameters: 'Dynamic',
        type: 'Modular Block'
      },
      status: 'Verified'
    });

    // Reset & close
    setTitle('');
    setDescription('');
    setTags('');
    setConnectToNodeId('');
    setIsAddNodeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-[#0D0F14] border border-slate-800 shadow-2xl p-6 relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Add Knowledge Node</h3>
              <p className="text-[11px] text-slate-400">Expand the Aether research graph</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddNodeModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Concept / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FlashAttention-2, LLaMA, Rotary Embedding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NodeCategory)}
                className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="MODEL">Model</option>
                <option value="ARCHITECTURE">Architecture</option>
                <option value="MECHANISM">Mechanism</option>
                <option value="DATASET">Dataset</option>
                <option value="METRIC">Metric</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Complexity
              </label>
              <input
                type="text"
                placeholder="e.g. O(n² · d)"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain the architectural significance and core functionality..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. NLP, ATTENTION, CUDA, MEMORY"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Connect to existing node */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Connect To
              </label>
              <select
                value={connectToNodeId}
                onChange={(e) => setConnectToNodeId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">(None)</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Edge Relation
              </label>
              <input
                type="text"
                placeholder="e.g. utilizes, derives_from"
                value={edgeLabel}
                onChange={(e) => setEdgeLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddNodeModalOpen(false)}
              className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold shadow-cyan-glow-sm transition-all"
            >
              Create Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

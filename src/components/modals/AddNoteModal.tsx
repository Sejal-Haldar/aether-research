import React, { useState } from 'react';
import { X, MessageSquarePlus, User } from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const AddNoteModal: React.FC = () => {
  const { 
    isAddNoteModalOpen, 
    setIsAddNoteModalOpen, 
    selectedNode, 
    addNoteToNode 
  } = useGraph();

  const [author, setAuthor] = useState('Aether Architect');
  const [content, setContent] = useState('');

  if (!isAddNoteModalOpen || !selectedNode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addNoteToNode(selectedNode.id, content.trim(), author.trim() || 'Aether Architect');
    setContent('');
    setIsAddNoteModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-[#0D0F14] border border-slate-800 shadow-2xl p-6 relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Add Research Annotation</h3>
              <p className="text-[11px] text-slate-400">
                Attaching note to: <span className="text-cyan-400 font-semibold">{selectedNode.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddNoteModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Author / Investigator
            </label>
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Research Note / Observation *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Record training dynamics, hardware constraints, algorithmic proofs, or citations..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddNoteModalOpen(false)}
              className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black font-semibold shadow-cyan-glow-sm transition-all"
            >
              Attach Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

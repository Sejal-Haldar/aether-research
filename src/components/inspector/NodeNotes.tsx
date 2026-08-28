import React from 'react';
import { Plus, User } from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

interface NodeNotesProps {
  notes?: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
}

export const NodeNotes: React.FC<NodeNotesProps> = ({ notes }) => {
  const { setIsAddNoteModalOpen } = useGraph();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
          RESEARCH NOTES ({notes?.length || 0})
        </span>
        <button
          onClick={() => setIsAddNoteModalOpen(true)}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Note</span>
        </button>
      </div>

      {!notes || notes.length === 0 ? (
        <div className="p-3 rounded-lg bg-[#12151E]/40 border border-slate-800/50 text-center">
          <p className="text-xs text-slate-500 italic">No notes added yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 rounded-lg bg-[#12151E] border border-slate-800/80 flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/40">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <User className="w-2.5 h-2.5 text-cyan-400" />
                  {note.author}
                </span>
                <span className="font-mono text-slate-500">{note.createdAt}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed pt-0.5 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

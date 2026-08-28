import React, { useState } from 'react';
import { X, FolderPlus, Check, Network, Brain, Atom } from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const NewWorkspaceModal: React.FC = () => {
  const {
    isNewWorkspaceModalOpen,
    setIsNewWorkspaceModalOpen,
    workspaces,
    activeWorkspace,
    switchWorkspace,
    createWorkspace
  } = useGraph();

  const [workspaceName, setWorkspaceName] = useState('');
  const [domainName, setDomainName] = useState('');

  if (!isNewWorkspaceModalOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    createWorkspace(
      workspaceName.trim(),
      domainName.trim() || 'General AI Research'
    );
    setWorkspaceName('');
    setDomainName('');
    setIsNewWorkspaceModalOpen(false);
  };

  const getWorkspaceIcon = (name: string) => {
    if (name.includes('Neural') || name.includes('Neuro')) return Brain;
    if (name.includes('Quantum')) return Atom;
    return Network;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-[#0D0F14] border border-slate-800 shadow-2xl p-6 relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Workspaces & Knowledge Domains</h3>
              <p className="text-[11px] text-slate-400">Switch or initialize a new research environment</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewWorkspaceModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Workspaces List */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            SWITCH ACTIVE WORKSPACE
          </label>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {workspaces.map((ws) => {
              const Icon = getWorkspaceIcon(ws.name);
              const isActive = ws.id === activeWorkspace.id;

              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsNewWorkspaceModalOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100 shadow-cyan-glow-sm'
                      : 'bg-[#12151E] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">{ws.name}</h4>
                      <p className="text-[10px] text-slate-400">{ws.domain} • {ws.nodeCount} nodes</p>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create New Workspace Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-3 pt-3 border-t border-slate-800 text-xs">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            OR CREATE NEW WORKSPACE
          </label>

          <div>
            <input
              type="text"
              required
              placeholder="Workspace Name (e.g. Diffusion Models)"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors mb-2"
            />
            <input
              type="text"
              placeholder="Domain / Field (e.g. Generative Vision)"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#12151E] border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewWorkspaceModalOpen(false)}
              className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black font-semibold shadow-cyan-glow-sm transition-all"
            >
              Initialize Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

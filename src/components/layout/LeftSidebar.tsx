import React from 'react';
import { 
  Atom, 
  Compass, 
  BookOpen, 
  FolderGit2, 
  Users, 
  Archive, 
  Settings, 
  HelpCircle, 
  Plus, 
  Sparkles, 
  Layers,
  ChevronRight,
  Database,
  Upload
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const LeftSidebar: React.FC = () => {
  const { 
    activeNavTab, 
    setActiveNavTab, 
    activeWorkspace, 
    setIsNewWorkspaceModalOpen,
    setIsSourceDrawerOpen,
    nodes,
    edges
  } = useGraph();

  const navItems = [
    { label: 'Overview', icon: Compass, badge: null },
    { label: 'My Knowledge', icon: BookOpen, badge: '14' },
    { label: 'Explore Graph', icon: Layers, badge: 'Live' },
    { label: 'Collections', icon: FolderGit2, badge: '3' },
    { label: 'Team Space', icon: Users, badge: '4' },
    { label: 'Archive', icon: Archive, badge: null },
  ];

  return (
    <aside className="w-60 bg-[#0D0F14] border-r border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0 z-20 select-none">
      {/* Top Header & Brand */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-950/40 border border-cyan-500/40 shadow-cyan-glow-sm">
            <Atom className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-wide text-slate-100">Aether Research</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono tracking-wider text-cyan-400/90 font-medium">
                KNOWLEDGE ARCHITECT
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Workspace Mini Card */}
        <div className="px-3 py-2.5 rounded-lg bg-[#12151E] border border-slate-800/80 flex items-center justify-between group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{activeWorkspace.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{activeWorkspace.domain}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsNewWorkspaceModalOpen(true)}
            className="text-slate-400 hover:text-cyan-400 p-1 transition-colors"
            title="Switch or create workspace"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Menu Options */}
        <nav className="flex flex-col gap-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            WORKSPACE VIEWS
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavTab === item.label;

            return (
              <button
                key={item.label}
                onClick={() => setActiveNavTab(item.label)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800/60 text-cyan-400 border-l-2 border-cyan-400 shadow-[inset_4px_0_12px_rgba(6,182,212,0.08)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      item.badge === 'Live'
                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utilities & Primary CTA */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-800/80">
        {/* Workspace Quick Stats */}
        <div className="px-2 py-1.5 rounded bg-[#12151E]/60 border border-slate-800/50 flex items-center justify-around text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-cyan-400" />
            <span><strong className="text-slate-200">{nodes.length}</strong> Nodes</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span><strong className="text-slate-200">{edges.length}</strong> Links</span>
          </div>
        </div>

        {/* Primary CTA Button: + New Workspace */}
        <button
          onClick={() => setIsNewWorkspaceModalOpen(true)}
          className="w-full py-2 bg-[#12151E] border border-slate-700 hover:bg-slate-800 text-cyan-400 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workspace</span>
        </button>

        {/* Import Research Source CTA */}
        <button
          onClick={() => setIsSourceDrawerOpen(true)}
          className="w-full py-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 text-cyan-300 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:shadow-[0_0_16px_rgba(6,182,212,0.2)]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Source</span>
        </button>

        {/* Bottom Utility Links */}
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => alert('Aether Settings v1.0.0 - Dark Theme & Graph Engine Active')}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </button>
          <button 
            onClick={() => alert('Aether Research Knowledge Graph Documentation\nShortcut: Ctrl+K / Cmd+K to search\nDrag nodes to reposition.\nClick nodes to inspect metadata.')}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Support & Docs</span>
          </button>
        </div>

        {/* User Account / Architect Status */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            AR
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-slate-200 truncate">Lead Architect</p>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Online • Sync Active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

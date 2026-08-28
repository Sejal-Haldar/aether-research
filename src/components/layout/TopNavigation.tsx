import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  GitBranch, 
  CircleDot, 
  Plus, 
  Download, 
  Sparkles,
  ChevronDown,
  Layers,
  Check
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';
import { NodeCategory } from '../../types/graph';

export const TopNavigation: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    categoryFilter, 
    setCategoryFilter, 
    layoutMode, 
    applyLayout,
    setIsAddNodeModalOpen,
    setIsCommandPaletteOpen,
    exportGraphJSON,
    activeWorkspace
  } = useGraph();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);

  const categories: { label: string; value: NodeCategory | 'ALL' }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Model', value: 'MODEL' },
    { label: 'Architecture', value: 'ARCHITECTURE' },
    { label: 'Mechanism', value: 'MECHANISM' },
    { label: 'Dataset', value: 'DATASET' },
    { label: 'Metric', value: 'METRIC' },
  ];

  return (
    <header className="h-14 border-b border-slate-800/80 flex items-center justify-between px-6 bg-[#0D0F14]/50 backdrop-blur-sm z-10 select-none">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
          Aether
        </span>
        <span className="text-slate-600">/</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 font-mono font-medium">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>GRAPH_VIEW</span>
        </div>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 font-medium">{activeWorkspace.name}</span>
      </div>

      {/* Center: Search Input Bar */}
      <div className="relative flex items-center">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-96 bg-[#12151E] border border-slate-700/60 hover:border-cyan-500/50 rounded-md px-3 py-1.5 text-xs text-slate-300 flex items-center justify-between transition-colors shadow-inner group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Search concepts, architectures, mechanisms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-64"
            />
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-sm">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Action Controls & Layout Toggles */}
      <div className="flex items-center gap-2.5">
        {/* Category Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              categoryFilter !== 'ALL'
                ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300'
                : 'bg-[#12151E] border-slate-700/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>{categoryFilter === 'ALL' ? 'Filter' : categoryFilter}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-[#0D0F14] border border-slate-800 shadow-panel z-50 p-1.5 flex flex-col gap-1">
              <div className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">
                Filter by Category
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategoryFilter(cat.value);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                    categoryFilter === cat.value
                      ? 'bg-slate-800 text-cyan-400 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{cat.label}</span>
                  {categoryFilter === cat.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Mode Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
            className="px-3 py-1.5 bg-[#12151E] border border-slate-700/60 hover:bg-slate-800 text-slate-300 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{layoutMode} Layout</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLayoutDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 rounded-lg bg-[#0D0F14] border border-slate-800 shadow-panel z-50 p-1.5 flex flex-col gap-1">
              <button
                onClick={() => {
                  applyLayout('free');
                  setIsLayoutDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                  layoutMode === 'free' ? 'bg-slate-800 text-cyan-400' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" />
                <span>Free Drag</span>
              </button>
              <button
                onClick={() => {
                  applyLayout('hierarchical');
                  setIsLayoutDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                  layoutMode === 'hierarchical' ? 'bg-slate-800 text-cyan-400' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Hierarchical</span>
              </button>
              <button
                onClick={() => {
                  applyLayout('radial');
                  setIsLayoutDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                  layoutMode === 'radial' ? 'bg-slate-800 text-cyan-400' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Radial Orbit</span>
              </button>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={exportGraphJSON}
          className="p-2 bg-[#12151E] border border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
          title="Export Graph as JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Primary Action Button: + Add Node */}
        <button
          onClick={() => setIsAddNodeModalOpen(true)}
          className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold rounded-md text-xs flex items-center gap-1.5 shadow-cyan-glow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Node</span>
        </button>
      </div>
    </header>
  );
};

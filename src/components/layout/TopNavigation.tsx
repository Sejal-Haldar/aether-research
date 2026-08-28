import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  Plus, 
  Download,
  ChevronDown,
  Check,
  Network,
  Orbit,
  GitGraph
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const TopNavigation: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    activeFilters, 
    setActiveFilters,
    selectedTagFilters,
    setSelectedTagFilters,
    layoutMode,
    setLayoutMode,
    setIsAddModalOpen,
    setIsWorkspaceModalOpen,
    activeWorkspace
  } = useGraph();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (layoutRef.current && !layoutRef.current.contains(event.target as Node)) {
        setIsLayoutOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const categories = ['Model', 'Architecture', 'Mechanism', 'Algorithm', 'Dataset'];
  const availableTags = ['#nlp', '#attention', '#encoder', '#frameworks'];

  const toggleCategory = (cat: string) => {
    setActiveFilters((prev: string[]) => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTagFilters((prev: string[]) => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleExportCanvas = async () => {
    setIsExporting(true);
    try {
      const svgElement = document.querySelector('svg.canvas-svg') || document.querySelector('svg');
      if (!svgElement) {
        alert('No active canvas element found to export.');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${activeWorkspace?.name || 'graph-workspace'}_${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export graph canvas:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const activeCount = activeFilters.length + selectedTagFilters.length;

  return (
    <header className="h-14 bg-[#0D0F14] border-b border-slate-800/80 px-4 flex items-center justify-between z-30 relative shrink-0">
      
      {/* Workspace Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <button 
          onClick={() => setIsWorkspaceModalOpen(true)}
          className="text-slate-400 hover:text-slate-200 font-medium transition-colors"
        >
          Aether
        </button>
        <span className="text-slate-600">/</span>
        <button 
          onClick={() => setIsWorkspaceModalOpen(true)}
          className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-[11px] font-semibold hover:border-cyan-500/40 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {activeWorkspace?.name || 'GRAPH_VIEW'}
        </button>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-3">
        
        {/* Search Input */}
        <div className="relative w-48 focus-within:w-64 transition-all duration-200">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search graph..."
            className="w-full pl-8 pr-7 py-1.5 bg-[#12151E] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-slate-800 px-1 rounded">⌘K</kbd>
        </div>

        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsLayoutOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeCount > 0 
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400' 
                : 'bg-[#12151E] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter {activeCount > 0 ? `(${activeCount} active)` : ''}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0D0F14] border border-slate-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-2">Node Types</span>
                  <div className="flex flex-col gap-1.5">
                    {categories.map((cat) => {
                      const checked = activeFilters.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                            checked ? 'bg-cyan-950/50 border border-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <span>{cat}</span>
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            checked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700'
                          }`}>
                            {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const checked = selectedTagFilters.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                            checked 
                              ? 'bg-cyan-500 text-slate-950 font-semibold' 
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeCount > 0 && (
                  <button
                    onClick={() => { setActiveFilters([]); setSelectedTagFilters([]); }}
                    className="text-right text-[11px] text-red-400 hover:text-red-300 pt-1"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Layout Dropdown */}
        <div className="relative" ref={layoutRef}>
          <button
            onClick={() => { setIsLayoutOpen(!isLayoutOpen); setIsFilterOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#12151E] border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{layoutMode} Layout</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLayoutOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0D0F14] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-1 text-xs">
              <button
                onClick={() => { setLayoutMode('free'); setIsLayoutOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  layoutMode === 'free' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Free Drag</span>
              </button>
              <button
                onClick={() => { setLayoutMode('hierarchical'); setIsLayoutOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  layoutMode === 'hierarchical' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <GitGraph className="w-4 h-4" />
                <span>Hierarchical</span>
              </button>
              <button
                onClick={() => { setLayoutMode('radial'); setIsLayoutOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  layoutMode === 'radial' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Orbit className="w-4 h-4" />
                <span>Radial Orbit</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={handleExportCanvas}
          disabled={isExporting}
          title="Export Canvas SVG"
          className="p-2 rounded-lg bg-[#12151E] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Node</span>
        </button>
      </div>

    </header>
  );
};

export default TopNavigation;
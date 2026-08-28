import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Layers, 
  Plus, 
  Maximize2, 
  RotateCcw, 
  Download, 
  ArrowRight
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    nodes,
    setSelectedNodeId,
    setIsAddNodeModalOpen,
    fitToView,
    resetView,
    exportGraphJSON,
    setPan,
    zoom
  } = useGraph();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Filter nodes matching search
  const filteredNodes = nodes.filter(node => 
    node.title.toLowerCase().includes(search.toLowerCase()) ||
    node.description.toLowerCase().includes(search.toLowerCase()) ||
    node.category.toLowerCase().includes(search.toLowerCase()) ||
    node.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  // Quick actions
  const quickActions = [
    {
      id: 'action-add-node',
      title: 'Create New Node',
      subtitle: 'Add concept to current canvas',
      icon: Plus,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsAddNodeModalOpen(true);
      }
    },
    {
      id: 'action-fit-view',
      title: 'Fit All in View',
      subtitle: 'Zoom out to encapsulate all nodes',
      icon: Maximize2,
      run: () => {
        setIsCommandPaletteOpen(false);
        fitToView();
      }
    },
    {
      id: 'action-reset-view',
      title: 'Reset Canvas View',
      subtitle: 'Set scale to 100% and center',
      icon: RotateCcw,
      run: () => {
        setIsCommandPaletteOpen(false);
        resetView();
      }
    },
    {
      id: 'action-export',
      title: 'Export Knowledge Graph JSON',
      subtitle: 'Download complete state as file',
      icon: Download,
      run: () => {
        setIsCommandPaletteOpen(false);
        exportGraphJSON();
      }
    }
  ].filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  const allItems = [
    ...filteredNodes.map(n => ({ type: 'node' as const, data: n })),
    ...quickActions.map(a => ({ type: 'action' as const, data: a }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'node') {
          setSelectedNodeId(current.data.id);
          setPan({
            x: Math.round(250 - current.data.x * zoom),
            y: Math.round(180 - current.data.y * zoom)
          });
          setIsCommandPaletteOpen(false);
        } else {
          current.data.run();
        }
      }
    }
  };

  return (
    <div 
      onClick={() => setIsCommandPaletteOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl bg-[#0D0F14] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#12151E]/60">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a concept name, category, or quick command..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {allItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No matching concepts or commands found.
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              if (item.type === 'node') {
                const node = item.data;
                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setPan({
                        x: Math.round(250 - node.x * zoom),
                        y: Math.round(180 - node.y * zoom)
                      });
                      setIsCommandPaletteOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                      isSelected ? 'bg-slate-800 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-100">{node.title}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                            {node.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-sm">{node.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                );
              } else {
                const action = item.data;
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.run}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                      isSelected ? 'bg-slate-800 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        <ActionIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-200">{action.title}</span>
                        <p className="text-[10px] text-slate-400">{action.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">Command</span>
                  </button>
                );
              }
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800 bg-[#0A0C10] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>ESC to close</span>
          </div>
          <span className="text-cyan-500">Aether Command Palette</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';

export interface FilterState {
  searchTerm: string;
  selectedTypes: string[];
  selectedTags: string[];
}

interface SearchFilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
  availableTags?: string[];
}

const ALL_TYPES = ['Model', 'Architecture', 'Mechanism', 'Algorithm', 'Dataset'];
const DEFAULT_TAGS = ['nlp', 'attention', 'encoder', 'frameworks'];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  onFilterChange,
  availableTags = DEFAULT_TAGS,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Model', 'Architecture']);
  const [selectedTags, setSelectedTags] = useState<string[]>(['nlp', 'attention']);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onFilterChange?.({ searchTerm, selectedTypes, selectedTags });
  }, [searchTerm, selectedTypes, selectedTags, onFilterChange]);

  const activeFilterCount = selectedTypes.length + selectedTags.length;

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedTags([]);
  };

  return (
    <div className="relative flex items-center gap-3 w-full max-w-4xl font-sans">
      <div className="relative flex-1 flex items-center">
        <svg
          className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search concepts, architectures, mechanisms..."
          className="w-full bg-slate-900/80 text-slate-100 placeholder-slate-400 text-sm rounded-lg pl-10 pr-16 py-2 border border-slate-700/80 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-md transition"
        />

        <div className="absolute right-3 flex items-center gap-1">
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-200 text-xs mr-1"
            >
              ✕
            </button>
          )}
          <kbd className="hidden sm:inline-block bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border backdrop-blur-md transition ${
            activeFilterCount > 0 || isPopoverOpen
              ? 'bg-slate-900/90 text-cyan-400 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount} active)` : ''}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isPopoverOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isPopoverOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl p-4 z-50">
            <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">
              TYPES]
            </div>

            <div className="space-y-1.5 mb-4">
              {ALL_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <label
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <span className="font-medium">{type}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>

            <hr className="border-slate-800 mb-3" />

            <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">
              TAGS
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono transition ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-400 hover:text-rose-300 transition hover:underline"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
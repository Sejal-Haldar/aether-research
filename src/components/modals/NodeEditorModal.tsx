import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Cpu, 
  GitBranch, 
  Sparkles, 
  Check
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';
import { NodeCategory } from '../../types/graph';

export const NodeEditorModal: React.FC = () => {
  const {
    isNodeEditorModalOpen,
    closeNodeEditor,
    editingNode,
    nodes,
    edges,
    updateNode,
    deleteNode
  } = useGraph();

  // Local Form State
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [doi, setDoi] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('O(n^2 · d)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(n^2)');
  const [parallelizable, setParallelizable] = useState<'High' | 'Medium' | 'Low'>('High');
  
  // Relations State
  interface RelationItem {
    id?: string;
    targetId: string;
    targetTitle: string;
    label: string;
  }
  const [connections, setConnections] = useState<RelationItem[]>([]);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [newRelationTargetId, setNewRelationTargetId] = useState('');
  const [newRelationLabel, setNewRelationLabel] = useState('utilizes');

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state with editingNode whenever modal opens
  useEffect(() => {
    if (editingNode) {
      setTitle(editingNode.title);
      
      // Categories: fallback to category or default list
      if (editingNode.categories && editingNode.categories.length > 0) {
        setCategories([...editingNode.categories]);
      } else {
        const catMap: Record<string, string[]> = {
          'MODEL': ['Model', 'Algorithm'],
          'ARCHITECTURE': ['Architecture', 'Deep Learning'],
          'MECHANISM': ['Mechanism', 'Operator'],
          'DATASET': ['Dataset', 'Corpus'],
          'METRIC': ['Metric', 'Benchmark']
        };
        setCategories(catMap[editingNode.category] || [editingNode.category]);
      }

      setDescription(editingNode.description);
      setDoi(editingNode.doi || editingNode.source?.doi || '10.48550/arXiv.1810.04805');
      setTags(editingNode.tags.map(t => t.toLowerCase()));
      
      setTimeComplexity(editingNode.complexityMatrix?.timeComplexity || 'O(n^2 · d)');
      setSpaceComplexity(editingNode.complexityMatrix?.spaceComplexity || 'O(n^2)');
      setParallelizable(editingNode.complexityMatrix?.parallelizable || 'High');

      // Populate linked nodes from edges
      const nodeEdges = edges.filter(e => e.source === editingNode.id);
      const initialRelations: RelationItem[] = nodeEdges.map(e => {
        const targetNode = nodes.find(n => n.id === e.target);
        return {
          id: e.id,
          targetId: e.target,
          targetTitle: targetNode ? targetNode.title : 'Unknown Node',
          label: e.label || 'utilizes'
        };
      });

      // If no outgoing edges, also check incoming to show bidirectional links
      if (initialRelations.length === 0) {
        const incomingEdges = edges.filter(e => e.target === editingNode.id);
        incomingEdges.forEach(e => {
          const sourceNode = nodes.find(n => n.id === e.source);
          if (sourceNode) {
            initialRelations.push({
              id: e.id,
              targetId: e.source,
              targetTitle: sourceNode.title,
              label: e.label || 'connected_to'
            });
          }
        });
      }

      setConnections(initialRelations);
      setIsAddingCategory(false);
      setIsAddingRelation(false);
      setNewTagInput('');
      setNewCategoryInput('');
    }
  }, [editingNode, edges, nodes, isNodeEditorModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNodeEditorModalOpen) {
        closeNodeEditor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNodeEditorModalOpen, closeNodeEditor]);

  if (!isNodeEditorModalOpen || !editingNode) return null;

  // Categories Handlers
  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(prev => prev.filter(c => c !== catToRemove));
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) {
      setIsAddingCategory(false);
      return;
    }
    if (!categories.includes(newCategoryInput.trim())) {
      setCategories(prev => [...prev, newCategoryInput.trim()]);
    }
    setNewCategoryInput('');
    setIsAddingCategory(false);
  };

  // Tags Handlers
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') {
      return;
    }
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    const clean = newTagInput.replace(/,/g, '').trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags(prev => [...prev, clean]);
    }
    setNewTagInput('');
  };

  // Relations Handlers
  const handleRemoveRelation = (indexToRemove: number) => {
    setConnections(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddRelation = () => {
    if (!newRelationTargetId) return;
    const targetNode = nodes.find(n => n.id === newRelationTargetId);
    if (!targetNode) return;

    setConnections(prev => [
      ...prev,
      {
        targetId: targetNode.id,
        targetTitle: targetNode.title,
        label: newRelationLabel || 'utilizes'
      }
    ]);

    setNewRelationTargetId('');
    setIsAddingRelation(false);
  };

  // Save Changes Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    // Derive primary category
    let primaryCategory: NodeCategory = editingNode.category;
    if (categories.length > 0) {
      const upperFirst = categories[0].toUpperCase();
      if (['MODEL', 'ARCHITECTURE', 'MECHANISM', 'DATASET', 'METRIC'].includes(upperFirst)) {
        primaryCategory = upperFirst as NodeCategory;
      }
    }

    updateNode(
      editingNode.id,
      {
        title: title.trim() || editingNode.title,
        category: primaryCategory,
        categories,
        badge: categories[0]?.toUpperCase() || editingNode.badge,
        description: description.trim(),
        doi: doi.trim(),
        tags: tags.length > 0 ? tags : editingNode.tags,
        complexityMatrix: {
          ...editingNode.complexityMatrix,
          timeComplexity,
          spaceComplexity,
          parallelizable
        },
        source: {
          ...editingNode.source,
          title: editingNode.source?.title || title,
          citation: editingNode.source?.citation || '',
          doi: doi.trim()
        }
      },
      connections.map(c => ({
        id: c.id,
        targetId: c.targetId,
        label: c.label
      }))
    );

    closeNodeEditor();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${editingNode.title}" from the knowledge graph?`)) {
      deleteNode(editingNode.id);
      closeNodeEditor();
    }
  };

  const availableNodesToConnect = nodes.filter(n => n.id !== editingNode.id);

  return (
    <div 
      onClick={closeNodeEditor}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200 select-none"
    >
      {/* Glassmorphic Modal Card */}
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              NODE TITLE
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BERT Transformer Node"
              className="w-full text-lg font-bold bg-[#12151E]/90 border border-slate-700/80 rounded-lg px-3.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans"
            />
          </div>

          <button
            onClick={closeNodeEditor}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
          {/* Categories Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                CATEGORIES
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Category</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 shadow-cyan-glow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-cyan-400/70 hover:text-rose-400 transition-colors p-0.5"
                    title={`Remove ${cat}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {isAddingCategory && (
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Category name..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                      }
                    }}
                    className="px-2.5 py-0.5 text-xs bg-[#12151E] border border-cyan-500/70 rounded-full text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="p-1 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold mb-1">
              DESCRIPTION / SUMMARY
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive summary of this knowledge node..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12151E]/90 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all resize-none leading-relaxed text-xs"
            />
          </div>

          {/* DOI Identifier */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold mb-1">
              DOI IDENTIFIER & CITATION
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-500 font-mono text-xs pointer-events-none">
                doi:
              </div>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.48550/arXiv.1810.04805"
                className="w-full pl-11 pr-3.5 py-2 rounded-xl bg-[#12151E]/90 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono text-xs"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
              TAGS & RESEARCH TOPICS
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#12151E]/90 border border-slate-700/80">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {/* Inline input to add new tags */}
              <input
                type="text"
                placeholder="Add tag (press Enter)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={() => handleAddTag()}
                className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 px-2 py-0.5 font-mono"
              />
            </div>
          </div>

          {/* Hardware Complexity Matrix */}
          <div className="p-3.5 rounded-xl bg-[#12151E]/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>HARDWARE COMPLEXITY MATRIX</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Time/Space Complexity */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Time / Space Complexity
                </label>
                <input
                  type="text"
                  value={timeComplexity}
                  onChange={(e) => setTimeComplexity(e.target.value)}
                  placeholder="e.g. O(n^2 · d)"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0E1118] border border-slate-700/80 text-cyan-300 font-mono font-medium focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* Parallelizable Rank Segmented Selector */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Parallelizable Rank
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#0E1118] border border-slate-700/80">
                  {(['High', 'Medium', 'Low'] as const).map((rank) => {
                    const isActive = parallelizable === rank;
                    return (
                      <button
                        key={rank}
                        type="button"
                        onClick={() => setParallelizable(rank)}
                        className={`py-1 text-[11px] font-mono font-semibold rounded transition-all ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        {rank}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Graph Connections Panel */}
          <div className="p-3.5 rounded-xl bg-[#12151E]/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span>GRAPH CONNECTIONS & RELATIONS ({connections.length})</span>
              </div>

              {!isAddingRelation && availableNodesToConnect.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingRelation(true)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Relation</span>
                </button>
              )}
            </div>

            {/* List of Connections */}
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {connections.length === 0 ? (
                <div className="text-center py-2 text-slate-500 text-[11px] italic">
                  No active relationships configured for this node.
                </div>
              ) : (
                connections.map((conn, idx) => (
                  <div
                    key={`${conn.targetId}-${idx}`}
                    className="p-2 rounded-lg bg-[#0E1118] border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-semibold text-slate-200 truncate text-xs">
                        {conn.targetTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-cyan-glow-sm">
                        {conn.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRelation(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove relation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Inline Add Relation Subform */}
            {isAddingRelation && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select
                    value={newRelationTargetId}
                    onChange={(e) => setNewRelationTargetId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E1118] border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
                  >
                    <option value="">Select target node...</option>
                    {availableNodesToConnect.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Relation (e.g. utilizes)"
                    value={newRelationLabel}
                    onChange={(e) => setNewRelationLabel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E1118] border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>

                <div className="col-span-3 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={handleAddRelation}
                    disabled={!newRelationTargetId}
                    className="px-2.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-semibold text-xs transition-colors"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingRelation(false)}
                    className="px-2 py-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-1">
            {/* Left: Delete Node Danger Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 transition-all text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Node</span>
            </button>

            {/* Right: Cancel & Primary Save Changes */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeNodeEditor}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

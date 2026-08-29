import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Link as LinkIcon, 
  Sparkles, 
  Check, 
  Loader2,
  File,
  GitCommit
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

type TabType = 'file' | 'url' | 'text';

export const SourceIngestionDrawer: React.FC = () => {
  const { 
    isSourceDrawerOpen, 
    setIsSourceDrawerOpen, 
    setNodes,
    selectedNodeId, 
    selectedNode,
    addEdge 
  } = useGraph();
  
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [rawTextInput, setRawTextInput] = useState<string>('');
  const [keyConceptExtraction, setKeyConceptExtraction] = useState<boolean>(true);
  const [autoConnect, setAutoConnect] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSourceDrawerOpen) return null;

  const handleClose = () => {
    setIsSourceDrawerOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUrlInput('');
    setRawTextInput('');
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const canProcess = Boolean(
    (activeTab === 'file' && selectedFile) ||
    (activeTab === 'url' && urlInput.trim().length > 0) ||
    (activeTab === 'text' && rawTextInput.trim().length > 0)
  );

  const handleProcess = async () => {
    if (!canProcess || isProcessing) return;
    setIsProcessing(true);

    try {
      if (activeTab === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

        const response = await fetch(`${API_BASE_URL}/api/extract-graph`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Extraction failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.nodes) {
          // Append extracted nodes to visual canvas
          setNodes((prevNodes: any[]) => [...prevNodes, ...data.nodes]);

          // Append extracted edges using addEdge from context
          if (data.edges && data.edges.length > 0) {
            data.edges.forEach((edge: any) => {
              addEdge(edge.source, edge.target, edge.label);
            });
          }

          // Auto connect first extracted concept node to active node if selected
          if (autoConnect && selectedNodeId && data.nodes.length > 0) {
            addEdge(data.nodes[0].id, selectedNodeId, 'references');
          }
        }
      } else {
        // Fallback for raw text/URL ingestion
        const newNodeId = `node-${Date.now()}`;
        const title = urlInput ? 'Web/DOI Source' : 'Raw Text Entry';
        const spawnX = selectedNode ? selectedNode.x + 260 : 250;
        const spawnY = selectedNode ? selectedNode.y + 40 : 180;

        setNodes((prevNodes: any[]) => [
          ...prevNodes,
          {
            id: newNodeId,
            title: title,
            category: 'SOURCE',
            description: `Imported via ${activeTab.toUpperCase()} ingestion engine.`,
            tags: ['#imported', '#source'],
            status: 'Verified',
            x: spawnX,
            y: spawnY,
            badge: 'SOURCE'
          }
        ]);

        if (autoConnect && selectedNodeId) {
          addEdge(newNodeId, selectedNodeId, 'references');
        }
      }
    } catch (error) {
      console.error('Error extracting knowledge graph:', error);
      alert('Failed to extract graph from PDF. Please check server logs.');
    } finally {
      setIsProcessing(false);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-[#0D0F14] border-l border-slate-800 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-start justify-between shrink-0 bg-[#0D0F14]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Import Research Source</h3>
              <p className="text-xs text-slate-400">Extract & inject into knowledge graph</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 pb-24 flex-1 overflow-y-auto flex flex-col gap-6">
          
          {/* Active Target Banner */}
          {selectedNode && (
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <GitCommit className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">Active Target Node</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{selectedNode.title}</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#12151E] border border-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-all ${
                activeTab === 'file' 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>PDF / File</span>
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-all ${
                activeTab === 'url' 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>DOI / URL</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-all ${
                activeTab === 'text' 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Text</span>
            </button>
          </div>

          {/* Tab 1: File Upload Zone */}
          {activeTab === 'file' && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                FILE UPLOAD
              </span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,.txt,.md" 
                className="hidden" 
              />
              
              {!selectedFile ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-cyan-400 bg-cyan-950/20' 
                      : 'border-slate-800 hover:border-slate-700 bg-[#12151E]/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-200">Drag & drop or click to browse</p>
                    <p className="text-[11px] text-slate-500 mt-1">.pdf, .txt, .md · up to 50 MB</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#12151E] border border-cyan-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-slate-200 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: URL Input */}
          {activeTab === 'url' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                DOI OR ARTICLE URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://doi.org/10.1038/... or https://arxiv.org/abs/..."
                className="w-full px-3 py-2.5 rounded-lg bg-[#12151E] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          {/* Tab 3: Raw Text */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                RAW TEXT INGESTION
              </label>
              <textarea
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder="Paste abstract, study excerpts, or raw notes..."
                rows={5}
                className="w-full p-3 rounded-lg bg-[#12151E] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>
          )}

          {/* Settings Section */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              EXTRACTION SETTINGS
            </span>

            {/* Concept Extraction Toggle */}
            <div className="p-3 bg-[#12151E] border border-slate-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200">Key Concept Extraction</p>
                  <p className="text-[10px] text-slate-400">Auto-identify terms from content</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKeyConceptExtraction(!keyConceptExtraction)}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                  keyConceptExtraction ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    keyConceptExtraction ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto-Connect Toggle */}
            <div className="p-3 bg-[#12151E] border border-slate-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <GitCommit className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200">Connect to Active Node</p>
                  <p className="text-[10px] text-slate-400">
                    {selectedNode ? `Link edge directly to ${selectedNode.title}` : 'No active target node selected'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!selectedNodeId}
                onClick={() => setAutoConnect(!autoConnect)}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                  autoConnect && selectedNodeId ? 'bg-cyan-500' : 'bg-slate-700 opacity-60'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    autoConnect && selectedNodeId ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800/80 flex flex-col gap-2 shrink-0 bg-[#0D0F14]">
          <button
            onClick={handleProcess}
            disabled={!canProcess || isProcessing}
            className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              canProcess && !isProcessing
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Knowledge...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Process & Link Source Node</span>
              </>
            ) }
          </button>
          
          <button
            onClick={handleClose}
            className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors text-center"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default SourceIngestionDrawer;
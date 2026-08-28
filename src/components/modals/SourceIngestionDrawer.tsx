import React, { useState, useCallback, useRef } from 'react';
import {
  X,
  Upload,
  Link,
  FileText,
  CheckCircle,
  AlertCircle,
  Cpu,
  GitBranch,
  Sparkles,
  ChevronRight,
  File,
  Trash2
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

/* ─────────────────────────── Types ─────────────────────────── */

type TabId = 'PDF' | 'URL' | 'Text';

interface ExtractionSettings {
  keyConcepts: boolean;
  relationships: boolean;
  complexity: boolean;
}

type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

/* ─────────────────────── Sub-components ────────────────────── */

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id }) => (
  <button
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
      checked
        ? 'border-cyan-500 bg-cyan-500/20'
        : 'border-slate-600 bg-slate-800'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow transition duration-200 ease-in-out ${
        checked
          ? 'translate-x-3.5 bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
          : 'translate-x-0.5 bg-slate-500'
      } mt-[1px]`}
    />
  </button>
);

/* ─────────────────────── Main Component ────────────────────── */

export const SourceIngestionDrawer: React.FC = () => {
  const { isSourceDrawerOpen, setIsSourceDrawerOpen, addNode } = useGraph();

  /* ── local state ── */
  const [activeTab, setActiveTab] = useState<TabId>('PDF');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [extractionSettings, setExtractionSettings] = useState<ExtractionSettings>({
    keyConcepts: true,
    relationships: true,
    complexity: false,
  });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */
  const close = useCallback(() => {
    setIsSourceDrawerOpen(false);
    setProcessingStatus('idle');
  }, [setIsSourceDrawerOpen]);

  const toggleSetting = (key: keyof ExtractionSettings) => {
    setExtractionSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasContent = (): boolean => {
    if (activeTab === 'PDF') return fileToUpload !== null;
    if (activeTab === 'URL') return pastedUrl.trim().length > 0;
    return rawText.trim().length > 0;
  };

  /* ── drag-and-drop ── */
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
    const file = e.dataTransfer.files[0];
    if (file && isAllowedFile(file)) {
      setFileToUpload(file);
    }
  };
  const isAllowedFile = (file: File) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
    const allowedExts = ['.pdf', '.txt', '.md'];
    return (
      allowed.includes(file.type) ||
      allowedExts.some(ext => file.name.toLowerCase().endsWith(ext))
    );
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAllowedFile(file)) {
      setFileToUpload(file);
    }
  };
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ── process action ── */
  const handleProcess = useCallback(() => {
    if (!hasContent()) return;
    setProcessingStatus('processing');

    // Simulate async ingestion (replace with real API call)
    setTimeout(() => {
      try {
        const label =
          activeTab === 'PDF'
            ? (fileToUpload?.name.replace(/\.[^.]+$/, '') ?? 'Imported Source')
            : activeTab === 'URL'
            ? new URL(pastedUrl.trim()).hostname.replace('www.', '')
            : 'Pasted Research Text';

        if (extractionSettings.keyConcepts) {
          addNode({
            title: label,
            category: 'MODEL',
            description:
              activeTab === 'Text'
                ? rawText.substring(0, 200)
                : `Imported from ${activeTab} source: ${label}`,
            tags: ['imported', activeTab.toLowerCase()],
            doi: activeTab === 'URL' ? pastedUrl.trim() : undefined,
          });
        }

        setProcessingStatus('success');
        setTimeout(() => {
          close();
          setFileToUpload(null);
          setPastedUrl('');
          setRawText('');
          setProcessingStatus('idle');
        }, 1400);
      } catch {
        setProcessingStatus('error');
      }
    }, 1800);
  }, [
    activeTab,
    fileToUpload,
    pastedUrl,
    rawText,
    extractionSettings,
    addNode,
    close,
    // hasContent is derived, not a ref
  ]);

  /* ── tab config ── */
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'PDF', label: 'PDF / File', icon: Upload },
    { id: 'URL', label: 'DOI / URL', icon: Link },
    { id: 'Text', label: 'Raw Text', icon: FileText },
  ];

  /* ─────────────── Render ─────────────── */
  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isSourceDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* ── Drawer panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Import Research Source"
        className={`fixed top-0 right-0 h-full z-50 w-[420px] max-w-full
          bg-slate-900/90 backdrop-blur-xl
          border-l border-cyan-500/40
          shadow-[-8px_0_40px_rgba(6,182,212,0.12)]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isSourceDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Upload size={15} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
                Import Research Source
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Extract &amp; inject into knowledge graph
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            aria-label="Close drawer"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Tab switcher ── */}
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/60">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setProcessingStatus('idle'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    active
                      ? 'bg-slate-900 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Content area ── */}

          {/* PDF Drop Zone */}
          {activeTab === 'PDF' && (
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                File Upload
              </label>

              {!fileToUpload ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer min-h-[180px] transition-all duration-200 ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select file to upload"
                  />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                    isDragging
                      ? 'bg-cyan-500/20 border-cyan-500/40'
                      : 'bg-slate-800 border-slate-700'
                  }`}>
                    <Upload size={20} className={isDragging ? 'text-cyan-400' : 'text-slate-500'} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-300 font-medium">
                      {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      .pdf, .txt, .md &nbsp;·&nbsp; up to 50 MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Uploaded file preview */
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <File size={16} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{fileToUpload.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatBytes(fileToUpload.size)}</p>
                  </div>
                  <button
                    onClick={() => setFileToUpload(null)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    aria-label="Remove file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DOI / URL Input */}
          {activeTab === 'URL' && (
            <div className="space-y-3">
              <label
                htmlFor="doi-url-input"
                className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
              >
                DOI or URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Link size={14} className="text-slate-500" />
                </div>
                <input
                  id="doi-url-input"
                  type="url"
                  value={pastedUrl}
                  onChange={e => setPastedUrl(e.target.value)}
                  placeholder="https://arxiv.org/abs/... or 10.48550/arXiv..."
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:bg-slate-800/80 focus:shadow-[0_0_12px_rgba(6,182,212,0.1)] transition-all"
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  'https://arxiv.org/abs/1810.04805',
                  'https://openreview.net',
                  'https://semanticscholar.org',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setPastedUrl(suggestion)}
                    className="text-[10px] text-cyan-600 hover:text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 rounded-md px-2 py-1 transition-colors truncate max-w-full"
                  >
                    {suggestion.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text */}
          {activeTab === 'Text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="raw-text-input"
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
                >
                  Research Text
                </label>
                <span className="text-[10px] text-slate-600">
                  {rawText.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                id="raw-text-input"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste your abstract, notes, or research excerpt here…"
                rows={10}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:bg-slate-800/80 focus:shadow-[0_0_12px_rgba(6,182,212,0.1)] transition-all resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* ── Extraction Settings ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Extraction Settings
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {(
              [
                {
                  key: 'keyConcepts' as const,
                  icon: Sparkles,
                  label: 'Key Concept Extraction',
                  desc: 'Auto-identify and create nodes for key terms',
                },
                {
                  key: 'relationships' as const,
                  icon: GitBranch,
                  label: 'Auto-Relationship Detection',
                  desc: 'Detect and draw edges between related concepts',
                },
                {
                  key: 'complexity' as const,
                  icon: Cpu,
                  label: 'Complexity Matrix Generation',
                  desc: 'Estimate time / space / parallelism metrics',
                },
              ] as const
            ).map(({ key, icon: Icon, label, desc }) => (
              <label
                key={key}
                htmlFor={`toggle-${key}`}
                className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 hover:border-slate-700/60 cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-slate-600 transition-colors">
                  <Icon size={14} className="text-cyan-500/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300">{label}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{desc}</p>
                </div>
                <ToggleSwitch
                  id={`toggle-${key}`}
                  checked={extractionSettings[key]}
                  onChange={() => toggleSetting(key)}
                />
              </label>
            ))}
          </div>

          {/* ── Processing feedback ── */}
          {processingStatus === 'processing' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-cyan-300">Processing source…</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Extracting concepts and building graph nodes</p>
              </div>
            </div>
          )}
          {processingStatus === 'success' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-300">Graph nodes created!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Closing drawer…</p>
              </div>
            </div>
          )}
          {processingStatus === 'error' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/30">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-300">Ingestion failed</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Check the URL / file format and try again</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 space-y-2">
          <button
            onClick={handleProcess}
            disabled={!hasContent() || processingStatus === 'processing' || processingStatus === 'success'}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200
              ${hasContent() && processingStatus === 'idle'
                ? 'bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400/70 shadow-[0_0_18px_rgba(6,182,212,0.2)] hover:shadow-[0_0_24px_rgba(6,182,212,0.3)] cursor-pointer'
                : 'bg-slate-800/40 border border-slate-700/40 text-slate-600 cursor-not-allowed'
              }`}
          >
            {processingStatus === 'processing' ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                Processing…
              </>
            ) : processingStatus === 'success' ? (
              <>
                <CheckCircle size={14} className="text-emerald-400" />
                Nodes Created!
              </>
            ) : (
              <>
                <ChevronRight size={14} />
                Process &amp; Generate Graph Nodes
              </>
            )}
          </button>

          <button
            onClick={close}
            disabled={processingStatus === 'processing'}
            className="w-full py-2.5 px-4 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </aside>
    </>
  );
};

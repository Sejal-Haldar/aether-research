import React from 'react';
import { 
  Radio, 
  AlertTriangle, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight
} from 'lucide-react';
import { useGraph } from '../../context/GraphContext';

export const InsightsFooter: React.FC = () => {
  const { 
    nodes, 
    edges, 
    insights, 
    resolveInsight, 
    isInsightsDrawerOpen, 
    setIsInsightsDrawerOpen 
  } = useGraph();

  // Graph statistics calculations
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  // Calculate approximate graph depth / diameter
  const depthLevel = nodeCount > 4 ? 'Lvl 2' : 'Lvl 1';

  const signalInsight = insights.find(i => i.type === 'signal') || {
    id: 'default-signal',
    title: 'Signal: Potential Connection Detected',
    description: 'Structural pattern match found across transformers & encoder networks.'
  };

  const gapInsight = insights.find(i => i.type === 'gap') || {
    id: 'default-gap',
    title: 'Knowledge Gap: Training Data Details Missing',
    description: 'Hardware profiling benchmarks are unassigned for selected modules.'
  };

  return (
    <>
      {/* Expandable Insights Drawer Modal / Panel */}
      {isInsightsDrawerOpen && (
        <div className="absolute bottom-14 left-0 right-80 bg-[#0D0F14]/95 backdrop-blur-xl border-t border-slate-800/80 p-5 z-20 shadow-2xl flex flex-col gap-4 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Automated Knowledge Engine Insights ({insights.length})
              </h3>
            </div>
            <button
              onClick={() => setIsInsightsDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Drawer ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-3 rounded-lg bg-[#12151E] border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {insight.type === 'signal' ? (
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    ) : insight.type === 'gap' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <h4 className="text-xs font-semibold text-slate-200 truncate">
                      {insight.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                    {insight.description}
                  </p>
                </div>

                <button
                  onClick={() => resolveInsight(insight.id)}
                  className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <span>{insight.actionText || 'Apply Recommendation'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Bottom Insights Bar */}
      <footer className="absolute bottom-0 left-0 right-80 h-14 bg-[#0D0F14]/90 backdrop-blur-md border-t border-slate-800/80 px-6 flex items-center justify-between z-10 text-xs select-none">
        {/* Left: Signals & Knowledge Gap Badges */}
        <div className="flex items-center gap-8 overflow-hidden">
          {/* Signal Indicator */}
          <div 
            onClick={() => setIsInsightsDrawerOpen(!isInsightsDrawerOpen)}
            className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-medium text-[11px] truncate group-hover:underline">
              {signalInsight.title}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

          {/* Knowledge Gap Indicator */}
          <div 
            onClick={() => setIsInsightsDrawerOpen(!isInsightsDrawerOpen)}
            className="flex items-center gap-2 text-slate-300 hover:text-amber-300 cursor-pointer transition-colors group"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
            <span className="font-medium text-[11px] truncate group-hover:underline">
              {gapInsight.title}
            </span>
          </div>
        </div>

        {/* Right: Graph Statistics & Expand Toggle */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-1 rounded bg-[#12151E] border border-slate-800/80 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              Nodes: <strong className="text-cyan-400">{nodeCount}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              Edges: <strong className="text-indigo-400">{edgeCount}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              Depth: <strong className="text-emerald-400">{depthLevel}</strong>
            </span>
          </div>

          <button
            onClick={() => setIsInsightsDrawerOpen(!isInsightsDrawerOpen)}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-1"
            title="Toggle Detailed Insights Drawer"
          >
            {isInsightsDrawerOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </footer>
    </>
  );
};

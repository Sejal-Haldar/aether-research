import React from 'react';
import { GraphProvider, useGraph } from './context/GraphContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { TopNavigation } from './components/layout/TopNavigation';
import { GraphCanvas } from './components/canvas/GraphCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { InsightsFooter } from './components/insights/InsightsFooter';
import { AddNodeModal } from './components/modals/AddNodeModal';
import { NewWorkspaceModal } from './components/modals/NewWorkspaceModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { AddNoteModal } from './components/modals/AddNoteModal';
import { NodeEditorModal } from './components/modals/NodeEditorModal';

const AppContent: React.FC = () => {
  const {
    setIsCommandPaletteOpen,
    zoomIn,
    zoomOut,
    resetView,
    selectedNodeId,
    deleteNode,
    setSelectedNodeId,
    setIsAddNodeModalOpen,
    setIsInsightsDrawerOpen
  } = useGraph();

  // Register Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetView: resetView,
    onDeleteSelected: () => {
      if (selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    },
    onEscape: () => {
      setSelectedNodeId(null);
      setIsInsightsDrawerOpen(false);
    },
    onNewNode: () => setIsAddNodeModalOpen(true)
  });

  return (
    <div className="h-screen w-screen bg-[#090A0E] text-slate-200 flex overflow-hidden font-sans select-none">
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <LeftSidebar />

      {/* 2. CENTRAL GRAPH VIEWPORT */}
      <main className="flex-1 h-full flex flex-col relative bg-[#090A0E] overflow-hidden">
        <TopNavigation />
        <GraphCanvas />
        <InsightsFooter />
      </main>

      {/* 3. RIGHT INSPECTOR PANEL */}
      <InspectorPanel />

      {/* GLOBAL MODALS & DIALOGS */}
      <AddNodeModal />
      <NewWorkspaceModal />
      <CommandPalette />
      <AddNoteModal />
      <NodeEditorModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GraphProvider>
      <AppContent />
    </GraphProvider>
  );
};

export default App;

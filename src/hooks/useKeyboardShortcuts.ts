import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onOpenCommandPalette: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onDeleteSelected: () => void;
  onEscape: () => void;
  onNewNode: () => void;
}

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onZoomIn,
  onZoomOut,
  onResetView,
  onDeleteSelected,
  onEscape,
  onNewNode
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }

      // Plus / Equals (Zoom in)
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        onZoomIn();
      }

      // Minus / Underscore (Zoom out)
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onZoomOut();
      }

      // Digit 0 (Reset view)
      if (e.key === '0') {
        e.preventDefault();
        onResetView();
      }

      // N (Add new node)
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNewNode();
      }

      // Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteSelected();
      }

      // Escape
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onOpenCommandPalette,
    onZoomIn,
    onZoomOut,
    onResetView,
    onDeleteSelected,
    onEscape,
    onNewNode
  ]);
}

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseGraphCanvasProps {
  zoom: number;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  updateNodePosition: (id: string, x: number, y: number) => void;
}

export function useGraphCanvas({
  zoom,
  pan,
  setPan,
  setZoom,
  updateNodePosition
}: UseGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle canvas pan start
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan if clicking directly on background canvas or svg, not on node or button
    const target = e.target as HTMLElement;
    if (
      target.closest('.graph-node') ||
      target.closest('.viewport-controls') ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }

    if (e.button === 0 || e.button === 1) { // Left or middle click
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  }, [pan.x, pan.y]);

  // Handle node drag start
  const handleNodeDragStart = useCallback((nodeId: string, nodeX: number, nodeY: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    
    // Calculate cursor offset in canvas coordinates
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - nodeX,
      y: (e.clientY - pan.y) / zoom - nodeY
    });
  }, [pan.x, pan.y, zoom]);

  // Handle mouse move for pan or node drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = Math.round((e.clientX - pan.x) / zoom - dragOffset.x);
      const newY = Math.round((e.clientY - pan.y) / zoom - dragOffset.y);
      updateNodePosition(draggingNodeId, newX, newY);
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [draggingNodeId, isPanning, pan.x, pan.y, zoom, dragOffset, panStart, updateNodePosition, setPan]);

  // Handle mouse up to end drag/pan
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  // Handle mouse wheel for zooming centered on mouse pointer
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prevZoom => {
      const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.4), 2.5);
      
      // Keep mouse position fixed in graph space
      setPan(prevPan => ({
        x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
        y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom)
      }));

      return newZoom;
    });
  }, [setZoom, setPan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return {
    containerRef,
    isPanning,
    draggingNodeId,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeDragStart
  };
}

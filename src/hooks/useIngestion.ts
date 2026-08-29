import { useState } from 'react';
import { ResearchAnalysisData } from '../types/graph';
import { buildResearchGraph } from '../utils/graphbuilder';

const API_BASE_URL = 'https://aether-research.onrender.com';

export function useIngestion() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [analysis, setAnalysis] = useState<ResearchAnalysisData | null>(null);

  const ingestSource = async (type: 'pdf' | 'url', payload: File | string) => {
    setLoading(true);
    setError(null);

    try {
      let response: Response;
      const endpoint = `${API_BASE_URL}/api/extract-graph`;

      if (type === 'pdf') {
        const formData = new FormData();
        formData.append('file', payload as File);

        response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(120000), // 2-minute timeout limit to prevent aborted requests
        });
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: payload }),
          signal: AbortSignal.timeout(120000), // 2-minute timeout limit
        });
      }

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || resJson.details || 'Content extraction and analysis failed.');
      }

      const researchData: ResearchAnalysisData = resJson.data;
      const documentTitle = resJson.meta?.title || researchData.title || 'Research Document';

      const graphData = buildResearchGraph(
        Date.now().toString(),
        documentTitle,
        researchData
      );

      setAnalysis(researchData);
      setGraph(graphData);
    } catch (err: any) {
      console.error('Ingestion Pipeline Error:', err);
      let message = err.message || 'An unexpected error occurred during processing.';
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        message = 'The request timed out while processing the document. Please try again.';
      }
      setError({ message });
    } finally {
      setLoading(false);
    }
  };

  return { ingestSource, loading, error, graph, analysis };
}
import { useState } from 'react';
import { ResearchAnalysisData } from '../types/graph';
import { buildResearchGraph } from '../utils/graphbuilder';

export function useIngestion() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [analysis, setAnalysis] = useState<ResearchAnalysisData | null>(null);

  const ingestSource = async (type: 'pdf' | 'url', payload: File | string) => {
    setLoading(true);
    setError(null);

    try {
      let extractRes;
      if (type === 'pdf') {
        const formData = new FormData();
        formData.append('file', payload as File);
        const res = await fetch('/api/ingest/pdf', { method: 'POST', body: formData });
        extractRes = await res.json();
      } else {
        const res = await fetch('/api/ingest/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: payload })
        });
        extractRes = await res.json();
      }

      if (!extractRes.success) {
        throw new Error(extractRes.error || 'Content extraction failed.');
      }

      // Trigger AI Analysis
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: extractRes.title,
          extractedText: extractRes.extractedText,
          sourceType: type
        })
      });

      const analyzeJson = await analyzeRes.json();
      if (!analyzeJson.success) {
        throw new Error(analyzeJson.error || 'AI content analysis failed.');
      }

      const researchData: ResearchAnalysisData = analyzeJson.data;
      const graphData = buildResearchGraph(Date.now().toString(), extractRes.title, researchData);

      setAnalysis(researchData);
      setGraph(graphData);
    } catch (err: any) {
      console.error('Ingestion Pipeline Error:', err);
      setError({ message: err.message || 'An unexpected error occurred during processing.' });
    } finally {
      setLoading(false);
    }
  };

  return { ingestSource, loading, error, graph, analysis };
}
import { useState, useCallback } from 'react';
import { staticDataService } from '@/services/staticDataService';
import type { DeckRanking, AnalysisStats } from '@shared/schema';
import type { AnalysisProgress } from '@/types';

export function useStaticAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [rankings, setRankings] = useState<DeckRanking[] | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);

  const startAnalysis = useCallback(async (deckIds: string[]) => {
    setSelectedDeckIds(deckIds);
    setIsAnalyzing(true);
    setIsCompleted(false);
    setRankings(null);
    setStats(null);
    
    // Simulate analysis progress for UI compatibility
    await staticDataService.simulateAnalysisProgress(
      (progressUpdate: AnalysisProgress) => {
        setProgress(progressUpdate);
      },
      async () => {
        // Analysis complete - load the actual data
        const rankings = await staticDataService.getDeckRankings(deckIds);
        const stats = await staticDataService.getAnalysisStats(deckIds);
        
        setRankings(rankings);
        setStats(stats);
        setIsAnalyzing(false);
        setIsCompleted(true);
        setProgress(null);
      }
    );
  }, []);

  const resetData = useCallback(() => {
    setIsAnalyzing(false);
    setProgress(null);
    setRankings(null);
    setStats(null);
    setIsCompleted(false);
    setSelectedDeckIds([]);
  }, []);

  const getAvailableDecks = useCallback(async () => {
    return await staticDataService.getAvailableDecks();
  }, []);

  const getDeckDetails = useCallback(async (deckId: string) => {
    return await staticDataService.getDeckDetails(deckId);
  }, []);

  const getMetadata = useCallback(async () => {
    return await staticDataService.getMetadata();
  }, []);

  return {
    isAnalyzing,
    progress,
    rankings,
    stats,
    isCompleted,
    hasData: isCompleted && rankings !== null,
    startAnalysis,
    resetData,
    getAvailableDecks,
    getDeckDetails,
    getMetadata
  };
}
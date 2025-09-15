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
    
    try {
      // Get deck metadata for structure (without cached prices)
      const availableDecks = await staticDataService.getAvailableDecks();
      const selectedDecks = availableDecks.filter(deck => deckIds.includes(deck.id));
      
      // Simulate progress while fetching real-time prices
      let current = 0;
      const total = selectedDecks.length;
      const rankings: DeckRanking[] = [];
      const values: number[] = [];
      
      setProgress({
        jobId: 'realtime-analysis',
        current: 0,
        total,
        percentage: 0,
        status: 'processing',
        message: 'Fetching real-time prices from Scryfall API...'
      });
      
      // Fetch real-time pricing for each deck
      for (const deck of selectedDecks) {
        try {
          // Call the real-time pricing API endpoint
          const response = await fetch(`/api/decks/${deck.id}/details`);
          if (response.ok) {
            const deckDetails = await response.json();
            const realTimeTotal = deckDetails.deck.totalValue || 0;
            values.push(realTimeTotal);
            
            rankings.push({
              rank: 0, // Will be set after sorting
              deck: {
                id: deck.id,
                name: deck.name,
                format: deck.format,
                commander: deck.commander,
                totalValue: realTimeTotal, // Use real-time total
                cardCount: deck.cardCount,
                uniqueCardCount: deck.uniqueCardCount,
                publicUrl: null,
                description: null
              },
              cardCount: deck.cardCount,
              totalValue: realTimeTotal // Use real-time total
            });
          }
        } catch (error) {
          console.error(`Error fetching real-time price for deck ${deck.id}:`, error);
          // Add deck with 0 value if API fails
          values.push(0);
          rankings.push({
            rank: 0,
            deck: {
              id: deck.id,
              name: deck.name,
              format: deck.format,
              commander: deck.commander,
              totalValue: 0,
              cardCount: deck.cardCount,
              uniqueCardCount: deck.uniqueCardCount,
              publicUrl: null,
              description: null
            },
            cardCount: deck.cardCount,
            totalValue: 0
          });
        }
        
        current++;
        setProgress({
          jobId: 'realtime-analysis',
          current,
          total,
          percentage: Math.round((current / total) * 100),
          status: 'processing',
          message: `Fetching real-time prices... (${current}/${total})`
        });
        
        // Rate limiting delay to respect Scryfall API
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Sort rankings by real-time total value and assign ranks
      rankings.sort((a, b) => b.totalValue - a.totalValue);
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });
      
      // Calculate stats from real-time values
      const validValues = values.filter(v => v > 0);
      const stats: AnalysisStats = {
        totalDecks: selectedDecks.length,
        uniqueCards: 0, // Will be computed separately if needed
        avgPrice: validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0,
        highestValue: validValues.length > 0 ? Math.max(...validValues) : 0,
        lowestValue: validValues.length > 0 ? Math.min(...validValues) : 0
      };
      
      setRankings(rankings);
      setStats(stats);
      setIsAnalyzing(false);
      setIsCompleted(true);
      setProgress(null);
      
    } catch (error) {
      console.error('Error during analysis:', error);
      setIsAnalyzing(false);
      setProgress(null);
    }
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
    // Use real-time API endpoint instead of cached static data
    try {
      const response = await fetch(`/api/decks/${deckId}/details`);
      if (response.ok) {
        return await response.json();
      } else {
        console.error(`Failed to fetch deck details for ${deckId}:`, response.statusText);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching deck details for ${deckId}:`, error);
      return null;
    }
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
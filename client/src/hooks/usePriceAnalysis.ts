import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  startAnalysis, 
  getAnalysisProgress, 
  getDeckRankings, 
  getAnalysisStats,
  resetAnalysis 
} from '@/services/scryfallApi';
import type { AnalysisProgress, AnalysisStats, DeckRanking, CSVRow } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const usePriceAnalysis = () => {
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: startAnalysis,
    onSuccess: (data) => {
      setAnalysisJobId(data.jobId);
      setIsAnalyzing(true);
      toast({
        title: "Analysis started",
        description: "Processing deck data and fetching card prices...",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed to start",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Reset analysis mutation
  const resetAnalysisMutation = useMutation({
    mutationFn: resetAnalysis,
    onSuccess: () => {
      setAnalysisJobId(null);
      setIsAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/decks/rankings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/stats'] });
      toast({
        title: "Data cleared",
        description: "All analysis data has been reset.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Progress tracking query
  const { data: progress } = useQuery<AnalysisProgress>({
    queryKey: ['/api/analysis', analysisJobId, 'progress'],
    queryFn: () => getAnalysisProgress(analysisJobId!),
    enabled: !!analysisJobId && isAnalyzing,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        setIsAnalyzing(false);
        if (data.status === 'completed') {
          // Invalidate related queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/decks/rankings'] });
          queryClient.invalidateQueries({ queryKey: ['/api/analysis/stats'] });
          toast({
            title: "Analysis completed",
            description: "Deck price analysis finished successfully!",
          });
        } else {
          toast({
            title: "Analysis failed",
            description: "There was an error processing the deck data.",
            variant: "destructive",
          });
        }
        return false;
      }
      return 1000; // Poll every second while processing
    },
  });

  // Deck rankings query
  const { 
    data: rankings, 
    isLoading: isLoadingRankings 
  } = useQuery<DeckRanking[]>({
    queryKey: ['/api/decks/rankings'],
    enabled: !isAnalyzing && !!analysisJobId,
  });

  // Analysis stats query
  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useQuery<AnalysisStats>({
    queryKey: ['/api/analysis/stats'],
    enabled: !isAnalyzing && !!analysisJobId,
  });

  const startAnalysisProcess = useCallback((csvData: CSVRow[]) => {
    startAnalysisMutation.mutate(csvData);
  }, [startAnalysisMutation]);

  const resetData = useCallback(() => {
    resetAnalysisMutation.mutate();
  }, [resetAnalysisMutation]);

  return {
    // State
    isAnalyzing,
    progress,
    rankings,
    stats,
    
    // Loading states
    isStarting: startAnalysisMutation.isPending,
    isResetting: resetAnalysisMutation.isPending,
    isLoadingRankings,
    isLoadingStats,
    
    // Actions
    startAnalysisProcess,
    resetData,
    
    // Computed
    hasData: !!rankings && rankings.length > 0,
    isCompleted: progress?.status === 'completed',
    isFailed: progress?.status === 'failed',
  };
};

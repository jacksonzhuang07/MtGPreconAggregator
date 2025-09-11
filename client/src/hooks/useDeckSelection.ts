import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { parseDecks } from '@/services/scryfallApi';
import type { DeckInfo, CSVRow } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useDeckSelection = () => {
  const [availableDecks, setAvailableDecks] = useState<DeckInfo[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  // Parse decks mutation
  const parseDecksMutation = useMutation({
    mutationFn: parseDecks,
    onSuccess: (decks: DeckInfo[]) => {
      setAvailableDecks(decks);
      toast({
        title: "Decks parsed successfully",
        description: `Found ${decks.length} unique commander decks. Select the ones you want to analyze.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to parse decks",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const parseDecksFromCsv = useCallback((csvData: CSVRow[]) => {
    setIsParsing(true);
    parseDecksMutation.mutate(csvData);
    setIsParsing(false);
  }, [parseDecksMutation]);

  const clearDecks = useCallback(() => {
    setAvailableDecks([]);
  }, []);

  return {
    // State
    availableDecks,
    isParsing: isParsing || parseDecksMutation.isPending,
    
    // Actions
    parseDecksFromCsv,
    clearDecks,
    
    // Computed
    hasDecks: availableDecks.length > 0,
  };
};
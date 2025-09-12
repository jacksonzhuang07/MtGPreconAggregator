import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { parseDecks } from '@/services/scryfallApi';
import type { DeckInfo, CSVRow } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useDeckSelection = () => {
  const [availableDecks, setAvailableDecks] = useState<DeckInfo[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  // Load embedded decks mutation
  const loadDecksMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/decks/parse');
      if (!response.ok) {
        throw new Error('Failed to load embedded deck data');
      }
      const data = await response.json();
      return data.decks;
    },
    onSuccess: (decks: DeckInfo[]) => {
      setAvailableDecks(decks);
      toast({
        title: "Decks loaded successfully",
        description: `Found ${decks.length} precon deck(s) ready for analysis.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to load decks",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const parseDecksFromCsv = useCallback((csvData: CSVRow[]) => {
    setIsParsing(true);
    // Legacy function for backwards compatibility - not used with embedded data
    setIsParsing(false);
  }, []);

  const loadEmbeddedDecks = useCallback(() => {
    loadDecksMutation.mutate();
  }, [loadDecksMutation]);

  const clearDecks = useCallback(() => {
    setAvailableDecks([]);
  }, []);

  return {
    // State
    availableDecks,
    isParsing: isParsing || loadDecksMutation.isPending,
    
    // Actions
    parseDecksFromCsv, // Legacy compatibility
    loadEmbeddedDecks,
    clearDecks,
    
    // Computed
    hasDecks: availableDecks.length > 0,
  };
};
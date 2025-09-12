import { useState, useEffect } from 'react';
import { DeckSelection } from '@/components/DeckSelection';
import { ProgressSection } from '@/components/ProgressSection';
import { StatsSummary } from '@/components/StatsSummary';
import { FilterControls } from '@/components/FilterControls';
import { PreconRankingTable } from '@/components/PreconRankingTable';
import { Button } from '@/components/ui/button';
import { usePriceAnalysis } from '@/hooks/usePriceAnalysis';
import { useDeckSelection } from '@/hooks/useDeckSelection';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, BookOpen, Github, HelpCircle, ArrowLeft } from 'lucide-react';
import type { FilterOptions } from '@/types';

export default function Home() {
  const [filteredRankings, setFilteredRankings] = useState<any[]>([]);
  const { toast } = useToast();
  
  const {
    isAnalyzing,
    progress,
    rankings,
    stats,
    isStarting,
    isResetting,
    isLoadingRankings,
    isLoadingStats,
    startAnalysisProcess,
    resetData,
    hasData,
    isCompleted,
  } = usePriceAnalysis();

  const {
    availableDecks,
    isParsing,
    loadEmbeddedDecks,
    clearDecks,
    hasDecks,
  } = useDeckSelection();

  const handleAnalyzeSelected = (selectedDecks: string[]) => {
    // Use embedded data, no CSV needed
    startAnalysisProcess(null, selectedDecks);
  };
  
  const handleBackToSelection = () => {
    // Reset analysis but keep deck selection
    resetData();
  };

  const handleFilterChange = (filters: FilterOptions) => {
    if (!rankings) return;
    
    let filtered = [...rankings];
    
    // Apply format filter
    if (filters.format && filters.format !== 'all') {
      filtered = filtered.filter(ranking => 
        ranking.deck.format === filters.format
      );
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(ranking =>
        ranking.deck.name.toLowerCase().includes(searchTerm) ||
        (ranking.deck.commander && ranking.deck.commander.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply price range filters
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(ranking => ranking.totalValue >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(ranking => ranking.totalValue <= filters.maxPrice!);
    }
    
    setFilteredRankings(filtered);
  };

  const handleExport = () => {
    if (!rankings || rankings.length === 0) {
      toast({
        title: "No data to export",
        description: "Please complete an analysis first.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Rank', 'Deck Name', 'Format', 'Commander', 'Card Count', 'Total Value'].join(','),
      ...rankings.map(ranking => [
        ranking.rank,
        `"${ranking.deck.name}"`,
        ranking.deck.format,
        `"${ranking.deck.commander || ''}"`,
        ranking.deck.cardCount,
        ranking.totalValue.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mtg-precon-rankings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Deck rankings have been exported to CSV.",
    });
  };

  const handleReset = () => {
    resetData();
    setFilteredRankings([]);
    // Reload embedded decks
    loadEmbeddedDecks();
  };

  // Load embedded decks on mount
  useEffect(() => {
    loadEmbeddedDecks();
  }, [loadEmbeddedDecks]);

  // Initialize filtered rankings when rankings are loaded
  useEffect(() => {
    if (rankings && filteredRankings.length === 0 && !isAnalyzing) {
      setFilteredRankings(rankings);
    }
  }, [rankings, filteredRankings.length, isAnalyzing]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground rounded-lg p-2">
                <div className="text-xl">🎴</div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">MTG Precon Price Analyzer</h1>
                <p className="text-sm text-muted-foreground">
                  Analyze and rank Magic: The Gathering preconstructed deck values
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(hasData || hasDecks) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex items-center space-x-2"
                  data-testid="button-reset"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              )}
              
              {hasData && !isAnalyzing && (
                <Button
                  variant="outline"
                  onClick={handleBackToSelection}
                  className="flex items-center space-x-2"
                  data-testid="button-back-to-selection"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Deck Selection</span>
                </Button>
              )}
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">Powered by Scryfall API</div>
                <div className="text-xs text-muted-foreground">Real-time MTG card pricing</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Deck Selection Section */}
        {hasDecks && !isAnalyzing && !hasData && (
          <DeckSelection
            decks={availableDecks}
            onAnalyzeSelected={handleAnalyzeSelected}
            isAnalyzing={isStarting}
          />
        )}
        
        {/* Loading State */}
        {isParsing && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">Loading Embedded Data</h3>
            <p className="text-muted-foreground">Preparing MTG precon deck data...</p>
          </div>
        )}

        {/* Progress Section */}
        {isAnalyzing && progress && (
          <ProgressSection progress={progress} />
        )}

        {/* Stats Summary */}
        {isCompleted && stats && !isLoadingStats && (
          <StatsSummary stats={stats} />
        )}

        {/* Filter Controls */}
        {hasData && !isLoadingRankings && (
          <FilterControls 
            onFilterChange={handleFilterChange}
            onExport={handleExport}
          />
        )}

        {/* Results Table */}
        {hasData && !isLoadingRankings && filteredRankings.length > 0 && (
          <PreconRankingTable 
            rankings={filteredRankings}
            onViewDeck={(deckId) => {
              toast({
                title: "Feature coming soon",
                description: "Deck detail view will be available in a future update.",
              });
            }}
            onExportDeck={(deckId) => {
              toast({
                title: "Feature coming soon", 
                description: "Individual deck export will be available in a future update.",
              });
            }}
          />
        )}

        {/* Loading Initial State */}
        {!hasData && !isAnalyzing && !isStarting && !hasDecks && !isParsing && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">Loading...</h3>
            <p className="text-muted-foreground">Preparing MTG precon data...</p>
          </div>
        )}

        {/* No Results State */}
        {hasData && !isLoadingRankings && filteredRankings.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">No matching decks found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              <p>MTG Precon Price Analyzer • Built with Scryfall API</p>
              <p className="mt-1">Data accuracy depends on Scryfall's daily price updates</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                data-testid="link-help"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                data-testid="link-docs"
              >
                <BookOpen className="h-4 w-4" />
                <span>API Docs</span>
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                data-testid="link-source"
              >
                <Github className="h-4 w-4" />
                <span>Source</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

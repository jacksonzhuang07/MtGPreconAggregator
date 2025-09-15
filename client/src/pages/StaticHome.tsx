import { useState, useEffect } from 'react';
import { DeckSelection } from '@/components/DeckSelection';
import { ProgressSection } from '@/components/ProgressSection';
import { StatsSummary } from '@/components/StatsSummary';
import { FilterControls } from '@/components/FilterControls';
import { PreconRankingTable } from '@/components/PreconRankingTable';
import { Button } from '@/components/ui/button';
import { useStaticAnalysis } from '@/hooks/useStaticAnalysis';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, BookOpen, Github, HelpCircle, ArrowLeft, Database } from 'lucide-react';
import type { FilterOptions, AnalysisProgress as ClientAnalysisProgress } from '@/types';

export default function StaticHome() {
  const [filteredRankings, setFilteredRankings] = useState<any[]>([]);
  const [availableDecks, setAvailableDecks] = useState<any[]>([]);
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const { toast } = useToast();
  
  const {
    isAnalyzing,
    progress,
    rankings,
    stats,
    isCompleted,
    hasData,
    startAnalysis,
    resetData,
    getAvailableDecks,
    getDeckDetails,
    getMetadata
  } = useStaticAnalysis();

  // Load available decks on component mount
  useEffect(() => {
    async function loadDecks() {
      try {
        const decks = await getAvailableDecks();
        setAvailableDecks(decks);
        console.log(`Loaded ${decks.length} precon decks from static data`);
      } catch (error) {
        console.error('Error loading static data:', error);
        toast({
          title: "Error loading data",
          description: "Failed to load precon deck data. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
    loadDecks();
  }, [getAvailableDecks, toast]);

  const handleAnalyzeSelected = (selectedDecks: string[]) => {
    console.log(`Starting analysis for ${selectedDecks.length} selected decks`);
    startAnalysis(selectedDecks);
    setShowDeckSelection(false);
  };
  
  const handleBackToSelection = () => {
    resetData();
    setShowDeckSelection(true);
    setFilteredRankings([]);
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
    setShowDeckSelection(false);
    setFilteredRankings([]);
  };

  const handleStartSelection = () => {
    setShowDeckSelection(true);
  };

  // Initialize filtered rankings when rankings are loaded
  useEffect(() => {
    if (rankings && filteredRankings.length === 0 && !isAnalyzing) {
      setFilteredRankings(rankings);
    }
  }, [rankings, filteredRankings.length, isAnalyzing]);

  // Get metadata for display
  const [metadata, setMetadata] = useState<any>(null);
  
  useEffect(() => {
    async function loadMetadata() {
      const meta = await getMetadata();
      setMetadata(meta);
    }
    loadMetadata();
  }, [getMetadata]);

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
                {metadata && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dataset: {metadata.totalDecks} decks • {metadata.totalCards} unique cards • Generated {new Date(metadata.generatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(hasData || showDeckSelection) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
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
                <div className="text-sm font-medium text-foreground">Static Dataset</div>
                <div className="text-xs text-muted-foreground">Pre-loaded MTG precon data</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section - Show when no selection is active */}
        {!showDeckSelection && !isAnalyzing && !hasData && (
          <div className="text-center py-12">
            <div className="bg-primary text-primary-foreground rounded-lg p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Database className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              MTG Precon Price Analyzer
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze {availableDecks.length} preconstructed Magic: The Gathering decks with real pricing data. 
              Select specific decks to compare values and find the best deals.
            </p>
            <Button
              onClick={handleStartSelection}
              size="lg"
              className="flex items-center space-x-2"
              data-testid="button-start-analysis"
            >
              <Database className="h-5 w-5" />
              <span>Browse Precon Decks</span>
            </Button>
            
            {metadata && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Total Decks</h3>
                  <p className="text-3xl font-bold text-primary">{metadata.totalDecks.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Unique Cards</h3>
                  <p className="text-3xl font-bold text-primary">{metadata.totalCards.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Data Source</h3>
                  <p className="text-sm text-muted-foreground">Moxfield Export</p>
                  <p className="text-xs text-muted-foreground">Updated {new Date(metadata.generatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Deck Selection Section */}
        {showDeckSelection && !isAnalyzing && !hasData && (
          <>
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowDeckSelection(false)}
                className="flex items-center space-x-2"
                data-testid="button-back-to-welcome"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Welcome</span>
              </Button>
            </div>
            <DeckSelection
              decks={availableDecks}
              onAnalyzeSelected={handleAnalyzeSelected}
              isAnalyzing={false}
            />
          </>
        )}

        {/* Progress Section */}
        {isAnalyzing && progress && (
          <ProgressSection progress={progress} />
        )}

        {/* Stats Summary */}
        {isCompleted && stats && (
          <StatsSummary stats={stats} />
        )}

        {/* Filter Controls */}
        {hasData && filteredRankings.length > 0 && (
          <FilterControls 
            onFilterChange={handleFilterChange}
            onExport={handleExport}
          />
        )}

        {/* Results Table */}
        {hasData && filteredRankings.length > 0 && (
          <PreconRankingTable 
            rankings={filteredRankings}
            onDeckUpdated={() => {
              // Refresh the rankings data after price updates by re-running analysis
              window.location.reload();
            }}
            onViewDeck={async (deckId) => {
              const details = await getDeckDetails(deckId);
              if (details) {
                console.log('Deck details:', details);
                toast({
                  title: details.deck.name,
                  description: `${details.cards.length} cards • $${details.deck.totalValue.toFixed(2)}`,
                });
              }
            }}
            onExportDeck={async (deckId) => {
              const details = await getDeckDetails(deckId);
              if (details) {
                const csvContent = [
                  ['Card Name', 'Set', 'Quantity', 'Price', 'Total', 'Type', 'Rarity'].join(','),
                  ...details.cards.map(card => [
                    `"${card.name}"`,
                    card.setCode || '',
                    card.quantity,
                    (card.priceUsd || 0).toFixed(2),
                    card.totalPrice.toFixed(2),
                    `"${card.type || ''}"`,
                    card.rarity || ''
                  ].join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${details.deck.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast({
                  title: "Export successful",
                  description: `${details.deck.name} exported to CSV.`,
                });
              }
            }}
          />
        )}

        {/* No Results State */}
        {hasData && filteredRankings.length === 0 && (
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
              <p>MTG Precon Price Analyzer • Static Dataset Edition</p>
              <p className="mt-1">Pricing data from Moxfield exports with Scryfall integration</p>
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
                <span>Docs</span>
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
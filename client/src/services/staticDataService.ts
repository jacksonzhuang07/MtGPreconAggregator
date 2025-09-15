import type { PreconDeck, Card, DeckRanking, AnalysisStats } from '@shared/schema';
import type { AnalysisProgress } from '@/types';

// Import the static dataset - using dynamic import to handle large JSON files
let staticData: any = null;

async function loadStaticData() {
  if (!staticData) {
    try {
      // Try to load from the shared directory
      const response = await fetch('/shared/static-precon-data.json');
      if (response.ok) {
        staticData = await response.json();
      } else {
        // Fallback: Create empty dataset structure
        console.warn('Static data file not found, creating empty dataset');
        staticData = {
          metadata: {
            generatedAt: new Date().toISOString(),
            totalDecks: 0,
            totalCards: 0,
            totalProcessedRows: 0,
            source: 'fallback'
          },
          decks: [],
          cards: [],
          stats: {
            avgDeckValue: 0,
            highestValue: 0,
            lowestValue: 0,
            avgCardsPerDeck: 0,
            formatDistribution: {},
            yearDistribution: {}
          }
        };
      }
    } catch (error) {
      console.error('Error loading static data:', error);
      // Create fallback empty dataset
      staticData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalDecks: 0,
          totalCards: 0,
          totalProcessedRows: 0,
          source: 'fallback'
        },
        decks: [],
        cards: [],
        stats: {
          avgDeckValue: 0,
          highestValue: 0,
          lowestValue: 0,
          avgCardsPerDeck: 0,
          formatDistribution: {},
          yearDistribution: {}
        }
      };
    }
  }
  return staticData;
}

export interface StaticPreconData {
  metadata: {
    generatedAt: string;
    totalDecks: number;
    totalCards: number;
    totalProcessedRows: number;
    source: string;
  };
  decks: PreconDeck[];
  cards: Card[];
  stats: {
    avgDeckValue: number;
    highestValue: number;
    lowestValue: number;
    avgCardsPerDeck: number;
    formatDistribution: Record<string, number>;
    yearDistribution: Record<string, number>;
  };
}

export interface DeckCard {
  cardId: string;
  cardName: string;
  quantity: number;
  finish: string;
  priceUsd: number | null;
  totalPrice: number;
}

export interface StaticDeck extends Omit<PreconDeck, 'id'> {
  id: string;
  cards: DeckCard[];
  releaseYear: number;
  setName: string;
}

export class StaticDataService {
  private data: StaticPreconData | null = null;
  private decksMap: Map<string, StaticDeck> = new Map();
  private cardsMap: Map<string, Card> = new Map();
  private isInitialized = false;

  async initialize() {
    if (!this.isInitialized) {
      this.data = await loadStaticData() as StaticPreconData;
      this.initializeMaps();
      this.isInitialized = true;
    }
    return this.data;
  }

  private initializeMaps() {
    if (!this.data) return;
    
    // Create cards map
    this.data.cards.forEach(card => {
      this.cardsMap.set(card.id, card);
    });

    // Create decks map with proper typing
    this.data.decks.forEach(deck => {
      const staticDeck: StaticDeck = {
        ...deck,
        cards: (deck as any).cards || [], // Type assertion for the cards array
        releaseYear: (deck as any).releaseYear || new Date().getFullYear(),
        setName: (deck as any).setName || 'Unknown Set'
      };
      this.decksMap.set(deck.id, staticDeck);
    });
  }

  // Get all available decks with basic info for selection
  async getAvailableDecks(): Promise<Array<{
    id: string;
    name: string;
    format: string;
    commander: string | null;
    cardCount: number;
    uniqueCardCount: number;
    totalValue: number;
    releaseYear: number;
    setName: string;
  }>> {
    await this.initialize();
    // Filter to only include actual precon decks
    return Array.from(this.decksMap.values())
      .filter(deck => deck.name && deck.name.includes('Precon'))
      .map(deck => ({
        id: deck.id,
        name: deck.name,
        format: this.normalizeFormat(deck.format),
        commander: deck.commander,
        cardCount: deck.cardCount || 0,
        uniqueCardCount: deck.uniqueCardCount || 0,
        totalValue: deck.totalValue || 0,
        releaseYear: deck.releaseYear,
        setName: deck.setName
      }));
  }

  // Get deck rankings with proper typing
  async getDeckRankings(selectedDeckIds?: string[], limit = 50): Promise<DeckRanking[]> {
    await this.initialize();
    let decks = Array.from(this.decksMap.values());
    
    // Filter by selected decks if provided
    if (selectedDeckIds && selectedDeckIds.length > 0) {
      decks = decks.filter(deck => selectedDeckIds.includes(deck.id));
    }
    
    // Sort by total value and create rankings
    const sortedDecks = decks
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, limit);

    return sortedDecks.map((deck, index) => ({
      rank: index + 1,
      deck: {
        id: deck.id,
        name: deck.name,
        format: this.normalizeFormat(deck.format),
        commander: deck.commander,
        totalValue: deck.totalValue || 0,
        cardCount: deck.cardCount || 0,
        uniqueCardCount: deck.uniqueCardCount || 0,
        publicUrl: deck.publicUrl,
        description: deck.description
      },
      cardCount: deck.cardCount || 0,
      totalValue: deck.totalValue || 0
    }));
  }

  // Get analysis stats for selected decks
  async getAnalysisStats(selectedDeckIds?: string[]): Promise<AnalysisStats> {
    await this.initialize();
    let decks = Array.from(this.decksMap.values());
    
    if (selectedDeckIds && selectedDeckIds.length > 0) {
      decks = decks.filter(deck => selectedDeckIds.includes(deck.id));
    }
    
    const values = decks.map(d => d.totalValue || 0).filter(v => v > 0);
    
    return {
      totalDecks: decks.length,
      uniqueCards: this.getUniqueCardsCount(decks),
      avgPrice: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      highestValue: values.length > 0 ? Math.max(...values) : 0,
      lowestValue: values.length > 0 ? Math.min(...values) : 0
    };
  }

  // Get deck details with card breakdown
  async getDeckDetails(deckId: string) {
    await this.initialize();
    const deck = this.decksMap.get(deckId);
    if (!deck) return null;

    const cardBreakdown = deck.cards.map(deckCard => {
      const card = this.cardsMap.get(deckCard.cardId);
      return {
        name: deckCard.cardName,
        setCode: card?.setCode || null,
        setName: card?.setName || null,
        quantity: deckCard.quantity,
        finish: deckCard.finish,
        priceUsd: deckCard.priceUsd || 0,
        totalPrice: deckCard.totalPrice,
        manaCost: card?.manaCost || null,
        type: card?.type || null,
        rarity: card?.rarity || null
      };
    }).sort((a, b) => b.totalPrice - a.totalPrice);

    return {
      deck: {
        id: deck.id,
        name: deck.name,
        format: this.normalizeFormat(deck.format),
        commander: deck.commander,
        totalValue: deck.totalValue || 0,
        cardCount: deck.cardCount || 0,
        uniqueCardCount: deck.uniqueCardCount || 0
      },
      cards: cardBreakdown
    };
  }

  // Get metadata about the dataset
  async getMetadata() {
    await this.initialize();
    
    // Calculate actual unique precon deck count
    const uniquePreconNames = new Set();
    this.decksMap.forEach((deck) => {
      if (deck.name && deck.name.includes('Precon')) {
        uniquePreconNames.add(deck.name);
      }
    });
    
    return {
      ...(this.data?.metadata || {}),
      totalDecks: uniquePreconNames.size,
      totalCards: this.cardsMap.size,
      actualPreconDecks: uniquePreconNames.size,
      generatedAt: this.data?.metadata?.generatedAt || new Date().toISOString(),
      totalProcessedRows: this.data?.metadata?.totalProcessedRows || 0,
      source: this.data?.metadata?.source || 'static-data'
    };
  }

  // Get format distribution for filtering
  async getFormatDistribution(): Promise<Record<string, number>> {
    await this.initialize();
    const distribution: Record<string, number> = {};
    
    Array.from(this.decksMap.values()).forEach(deck => {
      const format = this.normalizeFormat(deck.format);
      distribution[format] = (distribution[format] || 0) + 1;
    });
    
    return distribution;
  }

  // Simulate analysis progress for UI compatibility
  async simulateAnalysisProgress(onProgress: (progress: any) => void, onComplete: () => void) {
    await this.initialize();
    let current = 0;
    const total = this.data?.metadata.totalCards || 1000;
    
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 100) + 50;
      
      if (current >= total) {
        current = total;
        onProgress({
          current,
          total,
          percentage: 100,
          status: 'completed',
          message: 'Analysis completed successfully'
        });
        clearInterval(interval);
        setTimeout(onComplete, 500);
      } else {
        onProgress({
          current,
          total,
          percentage: Math.round((current / total) * 100),
          status: 'processing',
          message: `Processing static dataset... (${current}/${total})`
        });
      }
    }, 100);
  }

  private getUniqueCardsCount(decks: StaticDeck[]): number {
    const uniqueCardIds = new Set<string>();
    decks.forEach(deck => {
      deck.cards.forEach(card => {
        uniqueCardIds.add(card.cardId);
      });
    });
    return uniqueCardIds.size;
  }

  private normalizeFormat(format: string): string {
    // Clean up format strings from parsing issues
    if (!format || typeof format !== 'string') return 'unknown';
    
    const normalized = format.toLowerCase().trim();
    
    if (normalized.includes('commander')) return 'commander';
    if (normalized.includes('precon')) return 'commander';
    if (normalized.includes('standard')) return 'standard';
    if (normalized.includes('modern')) return 'modern';
    if (normalized.includes('legacy')) return 'legacy';
    if (normalized.includes('vintage')) return 'vintage';
    if (normalized.includes('pioneer')) return 'pioneer';
    
    // Handle specific cases from our data
    if (normalized === 'commanderprecons') return 'commander';
    if (normalized.length > 50) return 'commander'; // Likely parsing error
    
    return normalized === '' ? 'unknown' : normalized;
  }
}

// Create singleton instance
export const staticDataService = new StaticDataService();
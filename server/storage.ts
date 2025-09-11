import { 
  type Card, 
  type PreconDeck, 
  type DeckCard, 
  type AnalysisJob,
  type InsertCard, 
  type InsertPreconDeck, 
  type InsertDeckCard, 
  type InsertAnalysisJob,
  type PreconDeckWithDetails,
  type DeckRanking,
  type AnalysisStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Card operations
  createCard(card: InsertCard): Promise<Card>;
  getCard(id: string): Promise<Card | undefined>;
  getCardByName(name: string, setCode?: string): Promise<Card | undefined>;
  updateCardPrice(id: string, priceUsd: number): Promise<Card | undefined>;
  getAllCards(): Promise<Card[]>;

  // Precon deck operations
  createPreconDeck(deck: InsertPreconDeck): Promise<PreconDeck>;
  getPreconDeck(id: string): Promise<PreconDeck | undefined>;
  getPreconDeckWithDetails(id: string): Promise<PreconDeckWithDetails | undefined>;
  getAllPreconDecks(): Promise<PreconDeck[]>;
  updateDeckValue(id: string, totalValue: number, cardCount: number, uniqueCardCount: number): Promise<PreconDeck | undefined>;
  deleteAllDecks(): Promise<void>;

  // Deck card operations
  createDeckCard(deckCard: InsertDeckCard): Promise<DeckCard>;
  getDeckCards(deckId: string): Promise<DeckCard[]>;
  deleteAllDeckCards(): Promise<void>;

  // Analysis job operations
  createAnalysisJob(job: InsertAnalysisJob): Promise<AnalysisJob>;
  updateAnalysisJob(id: string, updates: Partial<AnalysisJob>): Promise<AnalysisJob | undefined>;
  getAnalysisJob(id: string): Promise<AnalysisJob | undefined>;

  // Analytics
  getDeckRankings(limit?: number): Promise<DeckRanking[]>;
  getAnalysisStats(): Promise<AnalysisStats>;
}

export class MemStorage implements IStorage {
  private cards: Map<string, Card>;
  private preconDecks: Map<string, PreconDeck>;
  private deckCards: Map<string, DeckCard>;
  private analysisJobs: Map<string, AnalysisJob>;

  constructor() {
    this.cards = new Map();
    this.preconDecks = new Map();
    this.deckCards = new Map();
    this.analysisJobs = new Map();
  }

  // Card operations
  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = randomUUID();
    const card: Card = {
      ...insertCard,
      id,
      priceUpdatedAt: new Date().toISOString(),
      type: insertCard.type || null,
      setCode: insertCard.setCode || null,
      setName: insertCard.setName || null,
      scryfallId: insertCard.scryfallId || null,
      manaCost: insertCard.manaCost || null,
      cmc: insertCard.cmc || null,
      rarity: insertCard.rarity || null,
      priceUsd: insertCard.priceUsd || null,
    };
    this.cards.set(id, card);
    return card;
  }

  async getCard(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getCardByName(name: string, setCode?: string): Promise<Card | undefined> {
    return Array.from(this.cards.values()).find(
      (card) => card.name === name && (!setCode || card.setCode === setCode)
    );
  }

  async updateCardPrice(id: string, priceUsd: number): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (card) {
      const updatedCard = {
        ...card,
        priceUsd,
        priceUpdatedAt: new Date().toISOString(),
      };
      this.cards.set(id, updatedCard);
      return updatedCard;
    }
    return undefined;
  }

  async getAllCards(): Promise<Card[]> {
    return Array.from(this.cards.values());
  }

  // Precon deck operations
  async createPreconDeck(insertDeck: InsertPreconDeck): Promise<PreconDeck> {
    const id = randomUUID();
    const deck: PreconDeck = {
      ...insertDeck,
      id,
      totalValue: 0,
      cardCount: 0,
      uniqueCardCount: 0,
      description: insertDeck.description || null,
      commander: insertDeck.commander || null,
      publicUrl: insertDeck.publicUrl || null,
    };
    this.preconDecks.set(id, deck);
    return deck;
  }

  async getPreconDeck(id: string): Promise<PreconDeck | undefined> {
    return this.preconDecks.get(id);
  }

  async getPreconDeckWithDetails(id: string): Promise<PreconDeckWithDetails | undefined> {
    const deck = this.preconDecks.get(id);
    if (!deck) return undefined;

    const deckCardsList = Array.from(this.deckCards.values()).filter(
      (dc) => dc.deckId === id
    );

    const cardsWithDetails = deckCardsList.map((deckCard) => {
      const card = this.cards.get(deckCard.cardId);
      return {
        ...deckCard,
        card: card!,
      };
    }).filter(item => item.card);

    return {
      ...deck,
      cards: cardsWithDetails,
    };
  }

  async getAllPreconDecks(): Promise<PreconDeck[]> {
    return Array.from(this.preconDecks.values());
  }

  async updateDeckValue(id: string, totalValue: number, cardCount: number, uniqueCardCount: number): Promise<PreconDeck | undefined> {
    const deck = this.preconDecks.get(id);
    if (deck) {
      const updatedDeck = {
        ...deck,
        totalValue,
        cardCount,
        uniqueCardCount,
      };
      this.preconDecks.set(id, updatedDeck);
      return updatedDeck;
    }
    return undefined;
  }

  async deleteAllDecks(): Promise<void> {
    this.preconDecks.clear();
  }

  // Deck card operations
  async createDeckCard(insertDeckCard: InsertDeckCard): Promise<DeckCard> {
    const id = randomUUID();
    const deckCard: DeckCard = {
      ...insertDeckCard,
      id,
      finish: insertDeckCard.finish || null,
      quantity: insertDeckCard.quantity || null,
    };
    this.deckCards.set(id, deckCard);
    return deckCard;
  }

  async getDeckCards(deckId: string): Promise<DeckCard[]> {
    return Array.from(this.deckCards.values()).filter(
      (dc) => dc.deckId === deckId
    );
  }

  async deleteAllDeckCards(): Promise<void> {
    this.deckCards.clear();
  }

  // Analysis job operations
  async createAnalysisJob(insertJob: InsertAnalysisJob): Promise<AnalysisJob> {
    const id = randomUUID();
    const job: AnalysisJob = {
      ...insertJob,
      id,
      status: insertJob.status || "pending",
      totalCards: insertJob.totalCards || null,
      processedCards: insertJob.processedCards || null,
      errorMessage: insertJob.errorMessage || null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.analysisJobs.set(id, job);
    return job;
  }

  async updateAnalysisJob(id: string, updates: Partial<AnalysisJob>): Promise<AnalysisJob | undefined> {
    const job = this.analysisJobs.get(id);
    if (job) {
      const updatedJob = { ...job, ...updates };
      this.analysisJobs.set(id, updatedJob);
      return updatedJob;
    }
    return undefined;
  }

  async getAnalysisJob(id: string): Promise<AnalysisJob | undefined> {
    return this.analysisJobs.get(id);
  }

  // Analytics
  async getDeckRankings(limit = 50): Promise<DeckRanking[]> {
    const decks = Array.from(this.preconDecks.values())
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, limit);

    return decks.map((deck, index) => ({
      rank: index + 1,
      deck,
      cardCount: deck.cardCount || 0,
      totalValue: deck.totalValue || 0,
    }));
  }

  async getAnalysisStats(): Promise<AnalysisStats> {
    const decks = Array.from(this.preconDecks.values());
    const values = decks.map(d => d.totalValue || 0).filter(v => v > 0);
    
    return {
      totalDecks: decks.length,
      uniqueCards: this.cards.size,
      avgPrice: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      highestValue: values.length > 0 ? Math.max(...values) : 0,
      lowestValue: values.length > 0 ? Math.min(...values) : 0,
    };
  }
}

export const storage = new MemStorage();

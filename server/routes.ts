import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { extractReleaseYearFromDeckName } from './precon-release-mapping';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Scryfall API integration
async function fetchCardPrice(cardName: string, setCode?: string, scryfallId?: string): Promise<number | null> {
  try {
    await sleep(100); // Rate limiting - Scryfall recommends 50-100ms delays
    
    let url: string;
    
    // Use Scryfall ID for exact card lookup if available (more accurate)
    if (scryfallId) {
      url = `https://api.scryfall.com/cards/${scryfallId}`;
    } else {
      // Fallback to name-based lookup
      url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
      if (setCode) {
        url += `&set=${setCode}`;
      }
    }
    
    console.log(`Fetching price for ${cardName} from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Card not found on Scryfall: ${cardName}`);
        return null; // Card not found
      }
      throw new Error(`Scryfall API error: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data.prices?.usd;
    const parsedPrice = price ? parseFloat(price) : null;
    console.log(`Price for ${cardName}: ${parsedPrice || 'null'} (raw: ${price})`);
    return parsedPrice;
  } catch (error) {
    console.error(`Error fetching price for ${cardName} (ID: ${scryfallId}):`, error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Parse CSV and extract deck information without analyzing
  app.post("/api/decks/parse", async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "Invalid CSV data" });
      }

      // First, group all rows by deck name to calculate release years from CSV data
      const deckRowsMap = new Map<string, any[]>();
      
      for (const row of csvData) {
        if (!row.name || !row.info?.name) continue;
        
        const deckId = row.name;
        if (!deckRowsMap.has(deckId)) {
          deckRowsMap.set(deckId, []);
        }
        deckRowsMap.get(deckId)!.push(row);
      }

      // Extract unique deck information using CSV release dates
      const deckMap = new Map<string, any>();
      
      for (const [deckId, rows] of Array.from(deckRowsMap.entries())) {
        const firstRow = rows[0];
        const setName = firstRow.info.set_name || "Unknown Set";
        const releaseYear = getDeckReleaseYear(rows);
        
        deckMap.set(deckId, {
          id: deckId,
          name: deckId,
          setName,
          releaseYear,
          format: firstRow.format || "unknown",
          commander: extractCommander(deckId),
          cardCount: 0,
          uniqueCards: new Set(),
        });
        
        // Add cards from all rows for this deck
        for (const row of rows) {
          const deck = deckMap.get(deckId)!;
          deck.cardCount += (row.quantity || 1);
          deck.uniqueCards.add(row.info.name);
        }
      }
      
      // Convert to array and add unique card counts
      const decks = Array.from(deckMap.values()).map(deck => ({
        ...deck,
        uniqueCardCount: deck.uniqueCards.size,
        uniqueCards: undefined, // Remove Set object for serialization
      }));
      
      res.json(decks);
    } catch (error) {
      console.error("Error parsing decks:", error);
      res.status(500).json({ error: "Failed to parse decks" });
    }
  });
  // Start price analysis job with selected decks
  app.post("/api/analysis/start", async (req, res) => {
    try {
      const { csvData, selectedDecks } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "Invalid CSV data" });
      }

      // Create analysis job
      const job = await storage.createAnalysisJob({
        status: "pending",
        totalCards: 0,
        processedCards: 0,
        errorMessage: null,
      });

      // Process CSV data in background with selected decks filter
      processCsvData(job.id, csvData, selectedDecks);

      res.json({ jobId: job.id });
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ error: "Failed to start analysis" });
    }
  });

  // Get analysis progress
  app.get("/api/analysis/:jobId/progress", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getAnalysisJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const totalCards = job.totalCards || 0;
      const processedCards = job.processedCards || 0;
      const percentage = totalCards > 0 ? Math.round((processedCards / totalCards) * 100) : 0;
      
      res.json({
        jobId: job.id,
        status: job.status,
        current: job.processedCards,
        total: job.totalCards,
        percentage,
        message: getProgressMessage(job.status, processedCards, totalCards),
      });
    } catch (error) {
      console.error("Error getting progress:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // Get deck rankings
  app.get("/api/decks/rankings", async (req, res) => {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam, 10) : 50;
      
      const rankings = await storage.getDeckRankings(limit);
      res.json(rankings);
    } catch (error) {
      console.error("Error getting rankings:", error);
      res.status(500).json({ error: "Failed to get rankings" });
    }
  });

  // Get analysis stats
  app.get("/api/analysis/stats", async (req, res) => {
    try {
      const stats = await storage.getAnalysisStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get deck details with card breakdown
  app.get("/api/decks/:deckId/details", async (req, res) => {
    try {
      const { deckId } = req.params;
      const deckDetails = await storage.getPreconDeckWithDetails(deckId);
      
      if (!deckDetails) {
        return res.status(404).json({ error: "Deck not found" });
      }

      // Format the response to include card breakdown with pricing
      const cardBreakdown = deckDetails.cards.map(deckCard => {
        const quantity = deckCard.quantity || 1;
        const priceUsd = deckCard.card.priceUsd || 0;
        return {
          name: deckCard.card.name,
          setCode: deckCard.card.setCode,
          setName: deckCard.card.setName,
          quantity,
          finish: deckCard.finish || 'nonFoil',
          priceUsd,
          totalPrice: priceUsd * quantity,
          manaCost: deckCard.card.manaCost,
          type: deckCard.card.type,
          rarity: deckCard.card.rarity,
        };
      }).sort((a, b) => b.totalPrice - a.totalPrice); // Sort by total price descending

      res.json({
        deck: {
          id: deckDetails.id,
          name: deckDetails.name,
          format: deckDetails.format,
          commander: deckDetails.commander,
          totalValue: deckDetails.totalValue,
          cardCount: deckDetails.cardCount,
          uniqueCardCount: deckDetails.uniqueCardCount,
        },
        cards: cardBreakdown,
      });
    } catch (error) {
      console.error("Error getting deck details:", error);
      res.status(500).json({ error: "Failed to get deck details" });
    }
  });

  // Get all decks with filtering
  app.get("/api/decks", async (req, res) => {
    try {
      const { format, search, minPrice, maxPrice } = req.query;
      let decks = await storage.getAllPreconDecks();

      // Apply filters
      if (format && format !== "All Formats") {
        decks = decks.filter(deck => deck.format === format);
      }

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        decks = decks.filter(deck => 
          deck.name.toLowerCase().includes(searchTerm) ||
          (deck.commander && deck.commander.toLowerCase().includes(searchTerm))
        );
      }

      if (minPrice) {
        const min = parseFloat(minPrice as string);
        decks = decks.filter(deck => (deck.totalValue || 0) >= min);
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        decks = decks.filter(deck => (deck.totalValue || 0) <= max);
      }

      // Sort by total value descending
      decks.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));

      res.json(decks);
    } catch (error) {
      console.error("Error getting decks:", error);
      res.status(500).json({ error: "Failed to get decks" });
    }
  });

  // Reset all data
  app.delete("/api/analysis/reset", async (req, res) => {
    try {
      await storage.deleteAllDecks();
      await storage.deleteAllDeckCards();
      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting data:", error);
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processCsvData(jobId: string, csvData: any[], selectedDecks?: string[]) {
  try {
    await storage.updateAnalysisJob(jobId, { status: "processing" });

    // Group cards by deck, filtering by selected decks if provided
    const deckMap = new Map<string, any>();
    const uniqueCards = new Set<string>();

    for (const row of csvData) {
      if (!row.name || !row.info?.name) continue;

      const deckName = row.name;
      const cardName = row.info.name;
      const setCode = row.info.set;
      
      // Skip decks not in selected list if filtering is enabled
      if (selectedDecks && selectedDecks.length > 0 && !selectedDecks.includes(deckName)) {
        continue;
      }

      if (!deckMap.has(deckName)) {
        deckMap.set(deckName, {
          name: deckName,
          format: row.format || "unknown",
          commander: extractCommander(deckName),
          publicUrl: row.publicUrl,
          description: row.description,
          cards: []
        });
      }

      deckMap.get(deckName)!.cards.push({
        name: cardName,
        setCode,
        quantity: row.quantity || 1,
        finish: row.finish || "nonFoil",
        scryfall_id: row.info.scryfall_id,
        mana_cost: row.info.mana_cost,
        cmc: row.info.cmc,
        type: row.info.type_line,
        rarity: row.info.rarity,
      });

      uniqueCards.add(`${cardName}|${setCode || ''}|${row.info.scryfall_id || ''}`);
    }

    const totalCards = uniqueCards.size;
    await storage.updateAnalysisJob(jobId, { totalCards });

    // Process unique cards and fetch prices
    const cardPriceMap = new Map<string, number>();
    let processedCards = 0;

    for (const cardKey of Array.from(uniqueCards)) {
      const [cardName, setCode, scryfallId] = cardKey.split('|');
      
      // Check if we already have this card
      let card = await storage.getCardByName(cardName, setCode || undefined);
      
      if (!card) {
        // Fetch price from Scryfall using scryfall_id when available for more accurate pricing
        const price = await fetchCardPrice(cardName, setCode || undefined, scryfallId || undefined);
        
        // Create new card record with scryfall_id
        card = await storage.createCard({
          name: cardName,
          setCode: setCode || null,
          priceUsd: price,
          scryfallId: scryfallId || null,
          setName: null,
          manaCost: null,
          cmc: null,
          type: null,
          rarity: null,
        });
      }

      if (card.priceUsd) {
        cardPriceMap.set(cardKey, card.priceUsd);
      }

      processedCards++;
      await storage.updateAnalysisJob(jobId, { processedCards });
    }

    // Create deck records and calculate values
    for (const [deckName, deckData] of Array.from(deckMap.entries())) {
      const deck = await storage.createPreconDeck({
        name: deckData.name,
        format: deckData.format,
        commander: deckData.commander,
        publicUrl: deckData.publicUrl,
        description: deckData.description,
      });

      let totalValue = 0;
      let cardCount = 0;
      const uniqueCardIds = new Set<string>();

      for (const cardData of deckData.cards) {
        const cardKey = `${cardData.name}|${cardData.setCode || ''}|${cardData.scryfall_id || ''}`;
        const card = await storage.getCardByName(cardData.name, cardData.setCode);
        
        if (card) {
          await storage.createDeckCard({
            deckId: deck.id,
            cardId: card.id,
            quantity: cardData.quantity,
            finish: cardData.finish,
          });

          uniqueCardIds.add(card.id);
          cardCount += cardData.quantity;
          
          if (card.priceUsd) {
            totalValue += card.priceUsd * cardData.quantity;
          }
        }
      }

      await storage.updateDeckValue(deck.id, totalValue, cardCount, uniqueCardIds.size);
    }

    await storage.updateAnalysisJob(jobId, { 
      status: "completed",
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error processing CSV data:", error);
    await storage.updateAnalysisJob(jobId, { 
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

function extractCommander(deckName: string): string | null {
  // Try to extract commander name from deck name
  const match = deckName.match(/Commander:\s*([^,\)]+)/i);
  return match ? match[1].trim() : null;
}

function getDeckReleaseYear(rows: any[]): number {
  // First priority: Use info.released_at from CSV data
  const releaseDates = rows
    .map(row => row.info?.released_at)
    .filter(date => date && typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/))
    .map(date => parseInt(date.slice(0, 4), 10))
    .filter(year => year >= 2011 && year <= 2030); // Reasonable range for MTG

  if (releaseDates.length > 0) {
    // Use the most common release year, or the first one if all are the same
    const yearCounts = releaseDates.reduce((acc, year) => {
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostCommonYear = Object.entries(yearCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return parseInt(mostCommonYear, 10);
  }

  // Fallback to legacy extraction using deck name and set name
  const firstRow = rows[0];
  if (firstRow) {
    return extractReleaseYearFromLegacySources(firstRow.name, firstRow.info?.set_name);
  }

  return new Date().getFullYear();
}

function extractReleaseYearFromLegacySources(deckName: string, setName?: string): number {
  // First try to get year from deck name (most accurate for commander precons)
  const deckNameYear = extractReleaseYearFromDeckName(deckName);
  if (deckNameYear) {
    return deckNameYear;
  }
  
  // Fallback to set name if provided
  if (setName) {
    // Map known sets to release years (legacy mapping)
    const setYearMap: Record<string, number> = {
      "Tarkir: Dragonstorm Commander": 2025,
      "Tarkir: Dragonstorm": 2025,
      "Commander 2024": 2024,
      "Commander 2023": 2023,
      "Commander 2022": 2022,
      "Commander 2021": 2021,
      "Commander 2020": 2020,
      "Commander 2019": 2019,
      "Commander 2018": 2018,
      "Commander 2017": 2017,
      "Commander 2016": 2016,
      "Commander 2015": 2015,
      "Commander 2014": 2014,
      "Commander 2013": 2013,
    };
    
    // Check exact matches first
    if (setYearMap[setName]) {
      return setYearMap[setName];
    }
    
    // Try to extract year from string patterns
    const yearMatch = setName.match(/(20\d{2})/);
    if (yearMatch) {
      return parseInt(yearMatch[1], 10);
    }
  }
  
  // Default to current year if unknown
  return new Date().getFullYear();
}

function extractReleaseYear(deckName: string, setName?: string): number {
  return extractReleaseYearFromLegacySources(deckName, setName);
}

function getProgressMessage(status: string, current: number, total: number): string {
  switch (status) {
    case "pending":
      return "Initializing analysis...";
    case "processing":
      return `Fetching card prices from Scryfall API... (${current}/${total})`;
    case "completed":
      return "Analysis completed successfully";
    case "failed":
      return "Analysis failed";
    default:
      return "Processing...";
  }
}

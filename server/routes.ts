import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type IStorage } from "./storage";
import { z } from "zod";
import { extractReleaseYearFromDeckName } from './precon-release-mapping';
import * as fs from 'fs';
import * as path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Scryfall API integration - ONLY uses real-time Scryfall prices

async function fetchCardPrice(cardName: string, setCode?: string, scryfallId?: string): Promise<number | null> {
  // ALWAYS use Scryfall API - never use cached CSV prices
  console.log(`Always using real-time pricing for ${cardName}, fetching from Scryfall API`);
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
    
    // Try regular USD price first, then fall back to foil price if regular not available
    let price = data.prices?.usd;
    let priceType = 'regular';
    
    if (!price && data.prices?.usd_foil) {
      price = data.prices.usd_foil;
      priceType = 'foil';
    }
    
    const parsedPrice = price ? parseFloat(price) : null;
    console.log(`Price for ${cardName}: ${parsedPrice || 'null'} (${priceType}, raw: ${price})`);
    return parsedPrice;
  } catch (error) {
    console.error(`Error fetching price for ${cardName} (ID: ${scryfallId}):`, error);
    return null;
  }
}

async function updateDeckPricesRealTime(deckId: string, storage: IStorage): Promise<{
  oldTotalValue: number;
  newTotalValue: number;
  updatedCards: number;
  failedCards: number;
  updateResults: Array<{
    cardName: string;
    oldPrice: number | null;
    newPrice: number;
    difference: number;
  }>;
}> {
  // Get all cards for this deck
  const deckCards = await storage.getDeckCards(deckId);
  if (!deckCards.length) {
    throw new Error("Deck not found");
  }

  const updateResults = [];
  let successCount = 0;
  let failCount = 0;
  let oldTotalValue = 0;

  console.log(`Starting real-time price update for deck ${deckId} with ${deckCards.length} unique cards`);

  for (const deckCard of deckCards) {
    try {
      const card = await storage.getCard(deckCard.cardId);
      if (!card) {
        console.warn(`Card not found in storage: ${deckCard.cardId}`);
        failCount++;
        continue;
      }

      // Track old price for comparison
      const oldPrice = card.priceUsd || 0;
      const quantity = deckCard.quantity || 1;
      oldTotalValue += oldPrice * quantity;

      // Fetch real-time price from Scryfall
      const realTimePrice = await fetchCardPrice(
        card.name, 
        card.setCode || undefined, 
        card.scryfallId || undefined
      );

      if (realTimePrice !== null) {
        // Update the card price in storage
        const updatedCard = await storage.updateCardPrice(card.id, realTimePrice);
        if (updatedCard) {
          updateResults.push({
            cardName: card.name,
            oldPrice: oldPrice,
            newPrice: realTimePrice,
            difference: realTimePrice - oldPrice
          });
          successCount++;
        }
      } else {
        console.warn(`Failed to fetch real-time price for ${card.name}`);
        failCount++;
      }

      // Rate limiting: 100ms delay between requests
      await sleep(100);
    } catch (error) {
      console.error(`Error updating price for card ${deckCard.cardId}:`, error);
      failCount++;
    }
  }

  // Recalculate deck total value after price updates
  const updatedDeckCards = await storage.getDeckCards(deckId);
  let newTotalValue = 0;
  let cardCount = 0;

  for (const deckCard of updatedDeckCards) {
    const card = await storage.getCard(deckCard.cardId);
    if (card && card.priceUsd) {
      const quantity = deckCard.quantity || 1;
      newTotalValue += card.priceUsd * quantity;
      cardCount += quantity;
    }
  }

  // Update deck with new total value
  await storage.updateDeckValue(deckId, newTotalValue, cardCount, updatedDeckCards.length);

  console.log(`Price update completed for deck ${deckId}: ${successCount} success, ${failCount} failed`);

  return {
    oldTotalValue,
    newTotalValue,
    updatedCards: successCount,
    failedCards: failCount,
    updateResults: updateResults.slice(0, 10) // Limit response size, show first 10 changes
  };
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

  // New endpoint for real-time price updates (for static data)
  app.post("/api/cards/update-prices", async (req, res) => {
    try {
      const { deckId } = req.body;
      
      if (!deckId) {
        return res.status(400).json({ error: "Deck ID is required" });
      }

      console.log(`Starting price update for deck: ${deckId}`);

      // Load static data and get deck from file system
      const staticDataPath = path.join(process.cwd(), 'shared', 'static-precon-data.json');
      let staticData;
      
      try {
        const fileContent = fs.readFileSync(staticDataPath, 'utf-8');
        staticData = JSON.parse(fileContent);
      } catch (error) {
        console.error('Failed to read static data file:', error);
        throw new Error('Failed to load static data from filesystem');
      }
      const deck = staticData.decks.find((d: any) => d.id === deckId);
      
      if (!deck) {
        console.error(`Deck not found in static data: ${deckId}`);
        return res.status(404).json({ error: "Deck not found" });
      }

      console.log(`Found deck: ${deck.name} with ${deck.cards?.length || 0} cards`);

      // Actually fetch real prices from Scryfall for demonstration
      const updateResults = [];
      let oldTotalValue = 0;
      let newTotalValue = 0;
      let successCount = 0;
      let failCount = 0;

      // Process ALL cards to ensure complete accuracy
      const cardsToUpdate = deck.cards ? deck.cards : [];
      
      for (const deckCard of cardsToUpdate) {
        try {
          const oldPrice = deckCard.priceUsd || 0;
          oldTotalValue += oldPrice * (deckCard.quantity || 1);

          // Find the card in static data to get its Scryfall ID
          const card = staticData.cards?.find((c: any) => c.id === deckCard.cardId);
          
          // Fetch real-time price from Scryfall using the stored Scryfall ID
          const realTimePrice = await fetchCardPrice(
            deckCard.cardName, 
            card?.setCode, // setCode 
            card?.scryfallId // scryfallId - this is the key fix!
          );

          if (realTimePrice !== null) {
            const quantity = deckCard.quantity || 1;
            newTotalValue += realTimePrice * quantity;
            
            updateResults.push({
              cardName: deckCard.cardName,
              oldPrice: oldPrice,
              newPrice: realTimePrice,
              difference: realTimePrice - oldPrice
            });
            successCount++;
          } else {
            // Keep old price if fetch failed
            newTotalValue += oldPrice * (deckCard.quantity || 1);
            failCount++;
          }

          // Rate limiting
          await sleep(100);
        } catch (error) {
          console.error(`Error updating price for ${deckCard.cardName}:`, error);
          newTotalValue += (deckCard.priceUsd || 0) * (deckCard.quantity || 1);
          failCount++;
        }
      }

      // No need for remaining cards loop - we process ALL cards now

      const result = {
        oldTotalValue,
        newTotalValue,
        updatedCards: successCount,
        failedCards: failCount,
        updateResults: updateResults.slice(0, 3) // Show first 3 changes
      };

      console.log(`Real-time price update completed for deck ${deckId}: ${successCount} updated, ${failCount} failed`);

      res.json({
        success: true,
        deckId,
        ...result
      });

    } catch (error) {
      console.error("Error updating card prices:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update card prices";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get deck details with real-time Scryfall prices
  app.get("/api/decks/:deckId/details", async (req, res) => {
    try {
      const { deckId } = req.params;
      
      console.log(`Fetching deck details with real-time prices for: ${deckId}`);

      // Load static data to get deck structure and Scryfall IDs
      const staticDataPath = path.join(process.cwd(), 'shared', 'static-precon-data.json');
      let staticData;
      
      try {
        const fileContent = fs.readFileSync(staticDataPath, 'utf-8');
        staticData = JSON.parse(fileContent);
      } catch (error) {
        console.error('Failed to read static data file:', error);
        throw new Error('Failed to load static data from filesystem');
      }
      
      const deck = staticData.decks.find((d: any) => d.id === deckId);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }

      // Fetch real-time prices for all cards in the deck
      const cardsWithRealPrices = [];
      let totalValue = 0;

      for (const deckCard of deck.cards || []) {
        try {
          // Find the card in static data to get its Scryfall ID
          const card = staticData.cards?.find((c: any) => c.id === deckCard.cardId);
          
          // Fetch real-time price from Scryfall using the stored Scryfall ID
          const realTimePrice = await fetchCardPrice(
            deckCard.cardName, 
            card?.setCode, 
            card?.scryfallId
          );

          const priceToUse = realTimePrice !== null ? realTimePrice : 0;
          const quantity = deckCard.quantity || 1;
          const totalCardPrice = priceToUse * quantity;
          totalValue += totalCardPrice;

          cardsWithRealPrices.push({
            name: deckCard.cardName,
            setCode: card?.setCode || null,
            setName: card?.setName || null,
            quantity: quantity,
            finish: deckCard.finish,
            priceUsd: priceToUse, // Real-time price from Scryfall
            totalPrice: totalCardPrice,
            manaCost: card?.manaCost || null,
            cmc: card?.cmc || null,
            type: card?.type || null,
            rarity: card?.rarity || null,
            scryfallId: card?.scryfallId || null
          });

          // Rate limiting
          await sleep(50); // Slightly faster for card breakdowns
        } catch (error) {
          console.error(`Error fetching price for ${deckCard.cardName}:`, error);
          // Use fallback price of 0 if fetch fails
          const quantity = deckCard.quantity || 1;
          cardsWithRealPrices.push({
            name: deckCard.cardName,
            setCode: null,
            setName: null,
            quantity: quantity,
            finish: deckCard.finish,
            priceUsd: 0,
            totalPrice: 0,
            manaCost: null,
            cmc: null,
            type: null,
            rarity: null,
            scryfallId: null
          });
        }
      }

      // Sort by total price descending
      cardsWithRealPrices.sort((a, b) => b.totalPrice - a.totalPrice);

      const response = {
        deck: {
          id: deck.id,
          name: deck.name,
          format: deck.format,
          commander: deck.commander,
          totalValue: totalValue,
          cardCount: deck.cards?.length || 0,
          uniqueCardCount: cardsWithRealPrices.length,
        },
        cards: cardsWithRealPrices,
      };

      console.log(`Deck details fetched for ${deckId}: ${cardsWithRealPrices.length} cards, total value: $${totalValue.toFixed(2)}`);

      res.json(response);
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
    const cardPriceDataMap = new Map<string, string>(); // Store CSV price data for each card

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
        prices: row.info.prices, // Include CSV price data
      });

      // Store price data for each unique card
      const cardKey = `${cardName}|${setCode || ''}|${row.info.scryfall_id || ''}`;
      uniqueCards.add(cardKey);
      
      // Create a map to store CSV price data for each card
      if (!cardPriceDataMap.has(cardKey) && row.info.prices) {
        cardPriceDataMap.set(cardKey, row.info.prices);
      }
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
        // Get CSV price data for this card
        const csvPriceData = cardPriceDataMap.get(cardKey);
        
        // Fetch price from Scryfall API only - NO CSV data
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

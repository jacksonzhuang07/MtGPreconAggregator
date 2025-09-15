import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust CSV parser that handles quoted fields, embedded commas, and newlines
function parseCSVLine(line, headers) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  values.push(current.trim());
  
  // Create object with headers
  const result = {};
  headers.forEach((header, index) => {
    result[header] = values[index] || '';
  });
  
  return result;
}

// Parse price data from the info.prices field
function parsePriceFromCSV(pricesString) {
  if (!pricesString || pricesString === 'None' || pricesString === '[]') {
    return null;
  }
  
  try {
    // Clean up the string to make it valid JSON
    let jsonString = pricesString
      .replace(/'/g, '"')
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null');
    
    const prices = JSON.parse(jsonString);
    
    // Helper to parse price values
    const parsePrice = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value);
      return null;
    };
    
    // Prioritize USD price, fall back to other sources
    const usdPrice = parsePrice(prices.usd);
    if (usdPrice !== null && usdPrice > 0) {
      return usdPrice;
    }
    
    // Fallback to other price sources
    const fallbackSources = ['ck', 'scg', 'ct', 'csi'];
    for (const source of fallbackSources) {
      const price = parsePrice(prices[source]);
      if (price !== null && price > 0) {
        return price;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error parsing price data: ${pricesString.substring(0, 100)}...`, error.message);
    return null;
  }
}

// Extract commander from deck name
function extractCommander(deckName) {
  // Common patterns for commander extraction
  const patterns = [
    /\(([^)]+)\s+Commander\s+Precon/i,
    /Commander:\s*([^,)]+)/i,
    /^([^(]+?)\s+\(/,
    /([^-]+)\s+-\s+/
  ];
  
  for (const pattern of patterns) {
    const match = deckName.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Extract release year from deck name or set info
function extractReleaseYear(row) {
  // Try to get from info.released_at first
  if (row['info.released_at'] && row['info.released_at'].match(/^\d{4}-\d{2}-\d{2}$/)) {
    const year = parseInt(row['info.released_at'].slice(0, 4), 10);
    if (year >= 2011 && year <= 2030) {
      return year;
    }
  }
  
  // Fallback to deck name patterns
  const deckName = row.name || '';
  const setName = row['info.set_name'] || '';
  
  // Check for year in deck name
  const yearMatch = deckName.match(/(20\d{2})/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  
  // Check set name mappings
  const setYearMap = {
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
  
  if (setYearMap[setName]) {
    return setYearMap[setName];
  }
  
  // Try to extract year from set name
  const setYearMatch = setName.match(/(20\d{2})/);
  if (setYearMatch) {
    return parseInt(setYearMatch[1], 10);
  }
  
  return new Date().getFullYear();
}

async function processCSVFile() {
  console.log('Starting CSV processing...');
  
  const csvPath = path.join(__dirname, '..', 'attached_assets', 'All_Precons_2025-07-27_1757906502975.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  
  console.log(`File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  // Parse header - first parse to get raw values, then create header array
  const headerValues = [];
  const headerLine = lines[0];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    
    if (char === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      headerValues.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  headerValues.push(current.trim());
  
  const headers = headerValues.map((header, index) => header || `column_${index}`);
  console.log(`Headers count: ${headers.length}`);
  console.log('Key headers:', headers.slice(0, 10));
  
  const decksMap = new Map();
  const cardsMap = new Map();
  let processedRows = 0;
  let skippedRows = 0;
  
  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i].trim();
      if (!line) continue;
      
      const row = parseCSVLine(line, headers);
      
      // Skip rows without essential data
      if (!row.name || !row['info.name']) {
        skippedRows++;
        continue;
      }
      
      const deckName = row.name;
      const cardName = row['info.name'];
      const quantity = parseInt(row.quantity) || 1;
      
      // Initialize deck if not exists
      if (!decksMap.has(deckName)) {
        decksMap.set(deckName, {
          id: deckName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          name: deckName,
          format: row.format || 'unknown',
          commander: extractCommander(deckName),
          releaseYear: extractReleaseYear(row),
          setName: row['info.set_name'] || 'Unknown Set',
          publicUrl: row.publicUrl || null,
          description: row.description || null,
          cards: [],
          totalValue: 0,
          cardCount: 0,
          uniqueCardCount: 0
        });
      }
      
      const deck = decksMap.get(deckName);
      
      // Create unique card identifier
      const cardKey = `${cardName}|${row['info.set'] || ''}|${row['info.scryfall_id'] || ''}`;
      
      // Parse price from CSV data
      const priceUsd = parsePriceFromCSV(row['info.prices']);
      
      // Create/update card record
      if (!cardsMap.has(cardKey)) {
        cardsMap.set(cardKey, {
          id: cardKey,
          name: cardName,
          setCode: row['info.set'] || null,
          setName: row['info.set_name'] || null,
          scryfallId: row['info.scryfall_id'] || null,
          manaCost: row['info.mana_cost'] || null,
          cmc: parseFloat(row['info.cmc']) || 0,
          type: row['info.type_line'] || null,
          rarity: row['info.rarity'] || null,
          priceUsd: priceUsd,
          artist: row['info.artist'] || null,
          releasedAt: row['info.released_at'] || null
        });
      }
      
      const card = cardsMap.get(cardKey);
      
      // Add card to deck
      deck.cards.push({
        cardId: cardKey,
        cardName: cardName,
        quantity: quantity,
        finish: row.finish || 'nonFoil',
        priceUsd: card.priceUsd,
        totalPrice: (card.priceUsd || 0) * quantity
      });
      
      deck.cardCount += quantity;
      
      processedRows++;
      
      if (processedRows % 5000 === 0) {
        console.log(`Processed ${processedRows} rows...`);
      }
      
    } catch (error) {
      console.error(`Error processing line ${i}:`, error.message);
      skippedRows++;
    }
  }
  
  console.log(`\nProcessing complete:`);
  console.log(`- Processed rows: ${processedRows}`);
  console.log(`- Skipped rows: ${skippedRows}`);
  console.log(`- Total decks: ${decksMap.size}`);
  console.log(`- Total unique cards: ${cardsMap.size}`);
  
  // Calculate deck totals
  for (const deck of decksMap.values()) {
    const uniqueCards = new Set();
    let totalValue = 0;
    
    for (const deckCard of deck.cards) {
      uniqueCards.add(deckCard.cardId);
      totalValue += deckCard.totalPrice || 0;
    }
    
    deck.uniqueCardCount = uniqueCards.size;
    deck.totalValue = Math.round(totalValue * 100) / 100; // Round to 2 decimal places
  }
  
  // Convert to arrays and sort
  const decks = Array.from(decksMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  const cards = Array.from(cardsMap.values());
  
  // Create comprehensive dataset
  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDecks: decks.length,
      totalCards: cards.length,
      totalProcessedRows: processedRows,
      source: 'All_Precons_2025-07-27_1757906502975.csv'
    },
    decks: decks,
    cards: cards,
    stats: {
      avgDeckValue: decks.reduce((sum, deck) => sum + deck.totalValue, 0) / decks.length,
      highestValue: Math.max(...decks.map(d => d.totalValue)),
      lowestValue: Math.min(...decks.map(d => d.totalValue)),
      avgCardsPerDeck: decks.reduce((sum, deck) => sum + deck.cardCount, 0) / decks.length,
      formatDistribution: decks.reduce((acc, deck) => {
        acc[deck.format] = (acc[deck.format] || 0) + 1;
        return acc;
      }, {}),
      yearDistribution: decks.reduce((acc, deck) => {
        acc[deck.releaseYear] = (acc[deck.releaseYear] || 0) + 1;
        return acc;
      }, {})
    }
  };
  
  // Write output files
  const outputPath = path.join(__dirname, '..', 'shared', 'static-precon-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
  
  // Also create a summary file
  const summaryPath = path.join(__dirname, '..', 'shared', 'precon-summary.json');
  const summary = {
    metadata: dataset.metadata,
    stats: dataset.stats,
    topDecks: decks.slice(0, 20).map(deck => ({
      name: deck.name,
      commander: deck.commander,
      totalValue: deck.totalValue,
      cardCount: deck.cardCount,
      releaseYear: deck.releaseYear
    })),
    deckNames: decks.map(deck => deck.name)
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`\nOutput files created:`);
  console.log(`- Full dataset: ${outputPath}`);
  console.log(`- Summary: ${summaryPath}`);
  
  console.log(`\nTop 10 most valuable decks:`);
  decks.slice(0, 10).forEach((deck, index) => {
    console.log(`${index + 1}. ${deck.name} - $${deck.totalValue} (${deck.cardCount} cards)`);
  });
  
  return dataset;
}

// Run the processor
if (import.meta.url === `file://${process.argv[1]}`) {
  processCSVFile().catch(console.error);
}

export { processCSVFile, parsePriceFromCSV };
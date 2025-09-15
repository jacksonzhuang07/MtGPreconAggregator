import fs from 'fs';
import Papa from 'papaparse';

// Read the CSV file
const csvContent = fs.readFileSync('attached_assets/All_Precons_2025-07-27_1757659632296.csv', 'utf8');

// Parse CSV
const parsed = Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => typeof header === 'string' ? header.trim() : header,
  transform: (value) => typeof value === 'string' ? value.trim() : value,
});

if (parsed.errors.length > 0) {
  console.error('CSV parsing errors:', parsed.errors);
  process.exit(1);
}

// Get all rows from all decks
const allRows = parsed.data;

console.log(`Found ${allRows.length} total cards from all decks`);

// Transform to the format needed by the server
const processedData = allRows
  .filter(row => row.name && row['info.name']) // Filter out invalid rows
  .map(row => ({
    id: row.id || '',
    name: row.name || '',
    format: row.format || '',
    quantity: parseInt(row.quantity || '1', 10),
    finish: row.finish || 'nonFoil',
    publicUrl: row.publicUrl,
    description: row.description,
    info: {
      name: row['info.name'] || '',
      set: row['info.set'],
      set_name: row['info.set_name'],
      scryfall_id: row['info.scryfall_id'],
      mana_cost: row['info.mana_cost'],
      cmc: parseFloat(row['info.cmc']) || 0,
      type_line: row['info.type_line'],
      rarity: row['info.rarity'],
      released_at: row['info.released_at'],
      prices: row['info.prices'],
    },
  }));

console.log(`Processed ${processedData.length} valid cards`);

// Create deck metadata from unique deck names
const uniqueDecks = [...new Set(processedData.map(row => row.name))];
const deckMetadata = uniqueDecks.map(deckName => {
  const deckRows = processedData.filter(row => row.name === deckName);
  const firstRow = deckRows[0];
  
  return {
    name: deckName,
    format: firstRow.format || 'commanderPrecons',
    setName: extractSetName(deckName),
    commander: extractCommander(deckName, deckRows),
    releaseYear: extractReleaseYear(firstRow.info.released_at) || 2025,
    cardCount: deckRows.length,
    publicUrl: firstRow.publicUrl,
    description: firstRow.description,
  };
});

console.log(`Created metadata for ${deckMetadata.length} unique decks`);

// Helper functions to extract deck information
function extractSetName(deckName) {
  // Extract set name from parentheses, e.g., "Deck Name (Set Name)" -> "Set Name"
  const match = deckName.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].replace(/Commander.*$/i, '').trim();
  }
  return 'Unknown Set';
}

function extractCommander(deckName, deckRows) {
  // Try to find the commander by looking for legendary creatures
  const legendaryCreatures = deckRows.filter(row => 
    row.info.type_line?.includes('Legendary') && row.info.type_line?.includes('Creature')
  );
  
  if (legendaryCreatures.length > 0) {
    return legendaryCreatures[0].info.name;
  }
  
  // Fallback: extract from deck name if it follows a pattern
  return 'Unknown Commander';
}

function extractReleaseYear(releasedAt) {
  if (releasedAt) {
    const year = parseInt(releasedAt.split('-')[0]);
    if (year && year > 1990 && year <= new Date().getFullYear() + 2) {
      return year;
    }
  }
  return null;
}

// Create the final data structure
const embeddedData = {
  decks: deckMetadata,
  rows: processedData
};

// Write to JSON file
const outputPath = 'server/data/precons.json';
fs.writeFileSync(outputPath, JSON.stringify(embeddedData, null, 2));

console.log(`✓ Embedded data written to ${outputPath}`);
console.log(`  - 1 deck: ${deckMetadata.name}`);
console.log(`  - ${processedData.length} cards with pricing data`);
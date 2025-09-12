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

// Filter for Abzan Armor deck only
const abzanArmorRows = parsed.data.filter(row => 
  row.name === 'Abzan Armor (Tarkir Dragonstorm Commander Precon Decklist)'
);

console.log(`Found ${abzanArmorRows.length} cards in Abzan Armor deck`);

// Transform to the format needed by the server
const processedData = abzanArmorRows
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

// Create deck metadata
const deckMetadata = {
  name: 'Abzan Armor (Tarkir Dragonstorm Commander Precon Decklist)',
  format: 'commanderPrecons',
  setName: 'Tarkir: Dragonstorm Commander',
  commander: 'Betor, Ancestor\'s Voice',
  releaseYear: 2025,
  cardCount: processedData.length,
  publicUrl: abzanArmorRows[0]?.publicUrl,
  description: abzanArmorRows[0]?.description,
};

// Create the final data structure
const embeddedData = {
  decks: [deckMetadata],
  rows: processedData
};

// Write to JSON file
const outputPath = 'server/data/precons.json';
fs.writeFileSync(outputPath, JSON.stringify(embeddedData, null, 2));

console.log(`✓ Embedded data written to ${outputPath}`);
console.log(`  - 1 deck: ${deckMetadata.name}`);
console.log(`  - ${processedData.length} cards with pricing data`);
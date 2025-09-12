import fs from 'fs';
import path from 'path';
import type { CSVRow } from '../client/src/types';
import { extractReleaseYearFromDeckName } from './precon-release-mapping';

interface DeckMetadata {
  name: string;
  format: string;
  setName: string;
  commander: string;
  releaseYear: number;
  cardCount: number;
  publicUrl?: string;
  description?: string;
}

interface EmbeddedData {
  decks: DeckMetadata[];
  rows: CSVRow[];
}

// Cache for embedded data
let cachedData: EmbeddedData | null = null;
let deckIndex: Map<string, CSVRow[]> | null = null;

/**
 * Load and cache the embedded precon data
 */
function loadEmbeddedData(): EmbeddedData {
  if (cachedData) {
    return cachedData;
  }

  try {
    const dataPath = path.join(process.cwd(), 'server/data/precons.json');
    const jsonContent = fs.readFileSync(dataPath, 'utf8');
    cachedData = JSON.parse(jsonContent);
    
    console.log(`✓ Loaded embedded data: ${cachedData!.decks.length} deck(s), ${cachedData!.rows.length} cards`);
    return cachedData!;
  } catch (error) {
    console.error('Failed to load embedded precon data:', error);
    throw new Error('Could not load embedded precon data');
  }
}

/**
 * Get deck index mapping deck names to their cards
 */
function getDeckIndex(): Map<string, CSVRow[]> {
  if (deckIndex) {
    return deckIndex;
  }

  const data = loadEmbeddedData();
  deckIndex = new Map();

  // Group rows by deck name
  for (const row of data.rows) {
    if (!deckIndex.has(row.name)) {
      deckIndex.set(row.name, []);
    }
    deckIndex.get(row.name)!.push(row);
  }

  console.log(`✓ Built deck index for ${deckIndex.size} deck(s)`);
  return deckIndex;
}

/**
 * Get all available deck metadata
 */
export function getAvailableDecks(): DeckMetadata[] {
  const data = loadEmbeddedData();
  return data.decks;
}

/**
 * Get rows for specific decks (or all if no filter provided)
 */
export function getDeckRows(selectedDecks?: string[]): CSVRow[] {
  const data = loadEmbeddedData();
  
  if (!selectedDecks || selectedDecks.length === 0) {
    return data.rows;
  }

  const index = getDeckIndex();
  const filteredRows: CSVRow[] = [];

  for (const deckName of selectedDecks) {
    const deckRows = index.get(deckName);
    if (deckRows) {
      filteredRows.push(...deckRows);
    }
  }

  console.log(`✓ Filtered to ${filteredRows.length} cards from ${selectedDecks.length} deck(s)`);
  return filteredRows;
}

/**
 * Get rows for a single test deck (for testing purposes)
 */
export function getTestDeckRows(testDeckName?: string): CSVRow[] {
  const data = loadEmbeddedData();
  
  // Default to first available deck if no test deck specified
  const targetDeck = testDeckName || data.decks[0]?.name;
  
  if (!targetDeck) {
    throw new Error('No test deck available');
  }

  const index = getDeckIndex();
  const testRows = index.get(targetDeck);
  
  if (!testRows) {
    throw new Error(`Test deck not found: ${targetDeck}`);
  }

  console.log(`✓ Using test deck: ${targetDeck} (${testRows.length} cards)`);
  return testRows;
}

/**
 * Clear cache (useful for development/testing)
 */
export function clearCache(): void {
  cachedData = null;
  deckIndex = null;
  console.log('✓ Cleared embedded data cache');
}
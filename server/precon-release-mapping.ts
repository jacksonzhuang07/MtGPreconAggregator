// Comprehensive mapping of Commander precon series to release years
// Based on official MTG Commander release timeline

export const PRECON_RELEASE_MAPPING: Record<string, number> = {
  // Early releases
  "Commander Theme Decks": 2009,
  
  // Annual releases  
  "Commander": 2011,
  "Commander's Arsenal": 2012,
  "Commander 2013": 2013,
  "Commander 2014": 2014,
  "Commander 2015": 2015,
  "Commander 2016": 2016,
  "Commander 2017": 2017,
  "Commander 2018": 2018,
  "Commander 2019": 2019,
  
  // Set-connected releases (2020 onwards)
  "Commander 2020": 2020,
  "Ikoria Commander": 2020,
  "Zendikar Rising Commander": 2020,
  "Commander Legends Commander": 2020,
  "Kaldheim Commander": 2021,
  "Commander 2021": 2021,
  "Strixhaven Commander": 2021,
  "Forgotten Realms Commander": 2021,
  "Adventures in the Forgotten Realms Commander": 2021,
  "Innistrad: Midnight Hunt Commander": 2021,
  "Innistrad: Crimson Vow Commander": 2021,
  "Kamigawa: Neon Dynasty Commander": 2022,
  "Streets of New Capenna Commander": 2022,
  "New Capenna Commander": 2022,
  "Commander Legends: Battle for Baldur's Gate Commander": 2022,
  "Dominaria United Commander": 2022,
  "The Brothers' War Commander": 2022,
  "Phyrexia: All Will Be One Commander": 2023,
  "March of the Machine Commander": 2023,
  "Commander Masters": 2023,
  "Wilds of Eldraine Commander": 2023,
  "The Lost Caverns of Ixalan Commander": 2023,
  "Lost Caverns Commander": 2023,
  "Murders at Karlov Manor Commander": 2024,
  "Outlaws of Thunder Junction Commander": 2024,
  "Thunder Junction Commander": 2024,
  "Modern Horizons 3 Commander": 2024,
  "MH3 Commander": 2024,
  "Bloomburrow Commander": 2024,
  "Duskmourn: House of Horror Commander": 2024,
  "Duskmourn Commander": 2024,
  
  // Future releases
  "Aetherdrift Commander": 2025,
  "Tarkir: Dragonstorm Commander": 2025,
  "Tarkir Dragonstorm Commander": 2025,
  
  // Anthologies
  "Commander Anthology": 2017,
  "Commander Anthology Volume II": 2018,
  
  // Starter decks
  "Starter Commander": 2022,
  "Starter Commander Decks": 2022,
  
  // Universes Beyond
  "Warhammer 40,000 Commander": 2022,
  "Warhammer 40000 Commander": 2022,
  "The Lord of the Rings: Tales of Middle-Earth Commander": 2023,
  "Lord of the Rings Commander": 2023,
  "Doctor Who Commander": 2023,
  "Fallout Commander": 2024,
  
  // Secret Lair
  "Secret Lair Commander": 2021, // Use earliest date for Secret Lair series
};

// Additional patterns that might appear in deck names
export const DECK_NAME_PATTERNS: Array<{ pattern: RegExp; year: number }> = [
  // Year-based patterns
  { pattern: /Commander 20(\d{2})/i, year: 0 }, // Will be calculated dynamically
  { pattern: /C(\d{2})/i, year: 0 }, // C20, C21, etc. - will be calculated
  
  // Set-specific patterns
  { pattern: /Ikoria.*Commander/i, year: 2020 },
  { pattern: /Zendikar Rising.*Commander/i, year: 2020 },
  { pattern: /Kaldheim.*Commander/i, year: 2021 },
  { pattern: /Strixhaven.*Commander/i, year: 2021 },
  { pattern: /Forgotten Realms.*Commander/i, year: 2021 },
  { pattern: /Midnight Hunt.*Commander/i, year: 2021 },
  { pattern: /Crimson Vow.*Commander/i, year: 2021 },
  { pattern: /Neon Dynasty.*Commander/i, year: 2022 },
  { pattern: /New Capenna.*Commander/i, year: 2022 },
  { pattern: /Baldur's Gate.*Commander/i, year: 2022 },
  { pattern: /Dominaria United.*Commander/i, year: 2022 },
  { pattern: /Brothers.*War.*Commander/i, year: 2022 },
  { pattern: /Phyrexia.*Commander/i, year: 2023 },
  { pattern: /March.*Machine.*Commander/i, year: 2023 },
  { pattern: /Eldraine.*Commander/i, year: 2023 },
  { pattern: /Ixalan.*Commander/i, year: 2023 },
  { pattern: /Karlov Manor.*Commander/i, year: 2024 },
  { pattern: /Thunder Junction.*Commander/i, year: 2024 },
  { pattern: /Modern Horizons 3.*Commander/i, year: 2024 },
  { pattern: /Bloomburrow.*Commander/i, year: 2024 },
  { pattern: /Duskmourn.*Commander/i, year: 2024 },
  { pattern: /Tarkir.*Dragonstorm.*Commander/i, year: 2025 },
  { pattern: /Aetherdrift.*Commander/i, year: 2025 },
];

export function extractReleaseYearFromDeckName(deckName: string): number | null {
  // First check exact matches
  for (const [seriesName, year] of Object.entries(PRECON_RELEASE_MAPPING)) {
    if (deckName.toLowerCase().includes(seriesName.toLowerCase())) {
      return year;
    }
  }
  
  // Then check pattern matches
  for (const { pattern, year } of DECK_NAME_PATTERNS) {
    const match = deckName.match(pattern);
    if (match) {
      if (year === 0 && match[1]) {
        // Handle dynamic year calculation for patterns like "Commander 2020" or "C20"
        const yearDigits = parseInt(match[1], 10);
        if (yearDigits >= 11 && yearDigits <= 99) {
          return 2000 + yearDigits; // C20 -> 2020, C21 -> 2021
        }
      } else if (year > 0) {
        return year;
      }
    }
  }
  
  return null;
}
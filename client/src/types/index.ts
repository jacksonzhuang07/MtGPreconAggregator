export interface CSVRow {
  id: string;
  name: string;
  format: string;
  quantity: number;
  finish: string;
  publicUrl?: string;
  description?: string;
  info: {
    name: string;
    set?: string;
    set_name?: string;
    scryfall_id?: string;
    mana_cost?: string;
    cmc?: number;
    type_line?: string;
    rarity?: string;
  };
}

export interface AnalysisProgress {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface AnalysisStats {
  totalDecks: number;
  uniqueCards: number;
  avgPrice: number;
  highestValue: number;
  lowestValue: number;
}

export interface DeckRanking {
  rank: number;
  deck: {
    id: string;
    name: string;
    format: string;
    commander?: string;
    totalValue: number;
    cardCount: number;
    uniqueCardCount: number;
  };
  cardCount: number;
  totalValue: number;
}

export interface FilterOptions {
  format?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

import { apiRequest } from '@/lib/queryClient';

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  prices: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
  };
  cmc: number;
  type_line: string;
  rarity: string;
  mana_cost?: string;
}

export const searchScryfallCard = async (name: string, set?: string): Promise<ScryfallCard | null> => {
  try {
    let url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;
    if (set) {
      url += `&set=${set}`;
    }

    const response = await fetch(url);
    
    if (response.status === 404) {
      return null; // Card not found
    }
    
    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching card ${name}:`, error);
    return null;
  }
};

export const startAnalysis = async (csvData: any[]) => {
  const response = await apiRequest('POST', '/api/analysis/start', { csvData });
  return response.json();
};

export const getAnalysisProgress = async (jobId: string) => {
  const response = await apiRequest('GET', `/api/analysis/${jobId}/progress`);
  return response.json();
};

export const getDeckRankings = async (limit = 50) => {
  const response = await apiRequest('GET', `/api/decks/rankings?limit=${limit}`);
  return response.json();
};

export const getAnalysisStats = async () => {
  const response = await apiRequest('GET', '/api/analysis/stats');
  return response.json();
};

export const getFilteredDecks = async (filters: {
  format?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters.format) params.append('format', filters.format);
  if (filters.search) params.append('search', filters.search);
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());

  const response = await apiRequest('GET', `/api/decks?${params.toString()}`);
  return response.json();
};

export const resetAnalysis = async () => {
  const response = await apiRequest('DELETE', '/api/analysis/reset');
  return response.json();
};

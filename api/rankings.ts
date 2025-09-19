import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all decks and return them as rankings
    const decks = await storage.getAllPreconDecks();
    
    // Sort by total value (descending)
    const rankings = decks
      .filter(deck => deck.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((deck, index) => ({
        rank: index + 1,
        deck: {
          id: deck.id,
          name: deck.name,
          format: deck.format,
          commander: deck.commander,
          totalValue: deck.totalValue,
          cardCount: deck.cardCount,
          uniqueCardCount: deck.uniqueCardCount
        }
      }));

    res.status(200).json({ rankings });

  } catch (error) {
    console.error('Error in rankings API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
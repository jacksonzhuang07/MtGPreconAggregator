import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all available decks
      const decks = await storage.getAllPreconDecks();
      
      const response = decks.map(deck => ({
        id: deck.id,
        name: deck.name,
        format: deck.format,
        commander: deck.commander,
        totalValue: deck.totalValue,
        cardCount: deck.cardCount,
        uniqueCardCount: deck.uniqueCardCount
      }));

      res.status(200).json(response);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in decks API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
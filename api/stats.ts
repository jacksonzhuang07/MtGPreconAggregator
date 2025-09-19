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
    // Get all decks for stats calculation
    const decks = await storage.getAllPreconDecks();
    const validDecks = decks.filter(deck => deck.totalValue > 0);
    
    if (validDecks.length === 0) {
      return res.status(200).json({
        totalDecks: 0,
        totalCards: 0,
        averageDeckValue: 0,
        highestValue: 0,
        lowestValue: 0
      });
    }

    const values = validDecks.map(deck => deck.totalValue);
    const totalCards = validDecks.reduce((sum, deck) => sum + deck.cardCount, 0);

    const stats = {
      totalDecks: validDecks.length,
      totalCards: totalCards,
      averageDeckValue: values.reduce((sum, val) => sum + val, 0) / values.length,
      highestValue: Math.max(...values),
      lowestValue: Math.min(...values)
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error in stats API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
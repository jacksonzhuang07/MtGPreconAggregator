import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../server/storage';

// Simple sleep function for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Scryfall API integration
async function fetchCardPrice(cardName: string, setCode?: string, scryfallId?: string): Promise<number | null> {
  try {
    await sleep(100); // Rate limiting
    
    let url: string;
    if (scryfallId) {
      url = `https://api.scryfall.com/cards/${scryfallId}`;
    } else {
      url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
      if (setCode) {
        url += `&set=${setCode}`;
      }
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Scryfall API error: ${response.status}`);
    }
    
    const data = await response.json();
    let price = data.prices?.usd;
    
    if (!price && data.prices?.usd_foil) {
      price = data.prices.usd_foil;
    }
    
    return price ? parseFloat(price) : null;
  } catch (error) {
    console.error(`Error fetching price for ${cardName}:`, error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deckId } = req.query;
    
    if (typeof deckId !== 'string') {
      return res.status(400).json({ error: 'Invalid deck ID' });
    }

    // Get deck information
    const deck = await storage.getPreconDeck(deckId);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Get cards in the deck
    const deckCards = await storage.getDeckCards(deckId);
    const cards = [];
    let totalValue = 0;

    for (const deckCard of deckCards) {
      const card = await storage.getCard(deckCard.cardId);
      if (card) {
        // Fetch real-time pricing
        const realTimePrice = await fetchCardPrice(
          card.name,
          card.setCode || undefined,
          card.scryfallId || undefined
        );

        const finalPrice = realTimePrice || card.priceUsd || 0;
        const totalPrice = finalPrice * (deckCard.quantity || 1);
        totalValue += totalPrice;

        cards.push({
          name: card.name,
          setCode: card.setCode,
          setName: card.setName,
          quantity: deckCard.quantity,
          finish: deckCard.finish,
          priceUsd: finalPrice,
          totalPrice: totalPrice,
          manaCost: card.manaCost,
          cmc: card.cmc,
          type: card.type,
          rarity: card.rarity,
          scryfallId: card.scryfallId
        });
      }
    }

    // Update deck total value
    await storage.updateDeckValue(deckId, totalValue, cards.length, cards.length);

    res.status(200).json({
      deck: {
        id: deck.id,
        name: deck.name,
        format: deck.format,
        commander: deck.commander,
        totalValue: totalValue,
        cardCount: deck.cardCount,
        uniqueCardCount: deck.uniqueCardCount
      },
      cards: cards
    });

  } catch (error) {
    console.error('Error in deck details API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
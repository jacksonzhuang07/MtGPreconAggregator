const fs = require('fs');
const path = require('path');

// Rate limiting helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch card price from Scryfall API
async function fetchCardPrice(cardName, setCode, scryfallId) {
  console.log(`Fetching real-time price for ${cardName} from Scryfall API`);
  try {
    await sleep(100); // Rate limiting
    
    let url;
    if (scryfallId) {
      url = `https://api.scryfall.com/cards/${scryfallId}`;
    } else {
      url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
      if (setCode) {
        url += `&set=${setCode}`;
      }
    }
    
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Card not found: ${cardName}`);
        return null;
      }
      throw new Error(`Scryfall API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try regular USD price first, then foil
    let price = data.prices?.usd;
    if (!price && data.prices?.usd_foil) {
      price = data.prices.usd_foil;
    }
    
    const parsedPrice = price ? parseFloat(price) : null;
    console.log(`Price for ${cardName}: ${parsedPrice || 'null'}`);
    return parsedPrice;
  } catch (error) {
    console.error(`Error fetching price for ${cardName}:`, error);
    return null;
  }
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract deckId from original path via query parameter or path
    let deckId = event.queryStringParameters?.deckId;
    
    if (!deckId) {
      // Try to extract from the original path in headers
      const originalPath = event.headers['x-nf-request-path'] || event.path;
      const pathMatch = originalPath.match(/\/api\/decks\/([^\/]+)\/details/);
      deckId = pathMatch ? pathMatch[1] : null;
    }
    
    if (!deckId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Deck ID is required' })
      };
    }

    console.log(`Fetching deck details for: ${deckId}`);

    // Load static data - try multiple possible paths
    let staticDataPath = path.join(__dirname, '../../shared/static-precon-data.json');
    if (!fs.existsSync(staticDataPath)) {
      staticDataPath = path.join(__dirname, '../../dist/public/shared/static-precon-data.json');
    }
    if (!fs.existsSync(staticDataPath)) {
      staticDataPath = path.join(process.cwd(), 'shared/static-precon-data.json');
    }
    let staticData;
    
    try {
      const fileContent = fs.readFileSync(staticDataPath, 'utf-8');
      staticData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Failed to read static data:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to load static data' })
      };
    }

    const deck = staticData.decks.find(d => d.id === deckId);
    if (!deck) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Deck not found' })
      };
    }

    // Fetch real-time prices for all cards
    const cardsWithRealPrices = [];
    let totalValue = 0;

    for (const deckCard of deck.cards || []) {
      try {
        const card = staticData.cards?.find(c => c.id === deckCard.cardId);
        
        const realTimePrice = await fetchCardPrice(
          deckCard.cardName,
          card?.setCode,
          card?.scryfallId
        );

        const priceToUse = realTimePrice !== null ? realTimePrice : 0;
        const quantity = deckCard.quantity || 1;
        const totalCardPrice = priceToUse * quantity;
        totalValue += totalCardPrice;

        cardsWithRealPrices.push({
          name: deckCard.cardName,
          setCode: card?.setCode || null,
          setName: card?.setName || null,
          quantity: quantity,
          finish: deckCard.finish,
          priceUsd: priceToUse,
          totalPrice: totalCardPrice,
          manaCost: card?.manaCost || null,
          cmc: card?.cmc || null,
          type: card?.type || null,
          rarity: card?.rarity || null,
          scryfallId: card?.scryfallId || null
        });

        await sleep(50); // Rate limiting
      } catch (error) {
        console.error(`Error processing ${deckCard.cardName}:`, error);
        const quantity = deckCard.quantity || 1;
        cardsWithRealPrices.push({
          name: deckCard.cardName,
          setCode: null,
          setName: null,
          quantity: quantity,
          finish: deckCard.finish,
          priceUsd: 0,
          totalPrice: 0,
          manaCost: null,
          cmc: null,
          type: null,
          rarity: null,
          scryfallId: null
        });
      }
    }

    const response = {
      deck: {
        id: deck.id,
        name: deck.name,
        format: deck.format,
        commander: deck.commander,
        totalValue: totalValue,
        cardCount: deck.cardCount,
        uniqueCardCount: deck.uniqueCardCount,
        publicUrl: deck.publicUrl,
        description: deck.description
      },
      cards: cardsWithRealPrices
    };

    console.log(`Deck details fetched: ${cardsWithRealPrices.length} cards, total: $${totalValue.toFixed(2)}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in deck-details function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { deckId } = JSON.parse(event.body || '{}');
    
    if (!deckId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Deck ID is required' })
      };
    }

    console.log(`Starting price update for deck: ${deckId}`);

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

    console.log(`Found deck: ${deck.name} with ${deck.cards?.length || 0} cards`);

    // Fetch real prices from Scryfall
    const updateResults = [];
    let oldTotalValue = 0;
    let newTotalValue = 0;
    let successCount = 0;
    let failCount = 0;

    const cardsToUpdate = deck.cards || [];
    
    for (const deckCard of cardsToUpdate) {
      try {
        const oldPrice = deckCard.priceUsd || 0;
        oldTotalValue += oldPrice * (deckCard.quantity || 1);

        const card = staticData.cards?.find(c => c.id === deckCard.cardId);
        
        const realTimePrice = await fetchCardPrice(
          deckCard.cardName,
          card?.setCode,
          card?.scryfallId
        );

        if (realTimePrice !== null) {
          const quantity = deckCard.quantity || 1;
          newTotalValue += realTimePrice * quantity;
          
          updateResults.push({
            cardName: deckCard.cardName,
            oldPrice: oldPrice,
            newPrice: realTimePrice,
            difference: realTimePrice - oldPrice
          });
          successCount++;
        } else {
          newTotalValue += oldPrice * (deckCard.quantity || 1);
          failCount++;
        }
      } catch (error) {
        console.error(`Error updating ${deckCard.cardName}:`, error);
        const oldPrice = deckCard.priceUsd || 0;
        newTotalValue += oldPrice * (deckCard.quantity || 1);
        failCount++;
      }
    }

    const result = {
      success: true,
      deckId,
      deckName: deck.name,
      updatedCards: successCount,
      failedCards: failCount,
      totalCards: cardsToUpdate.length,
      oldTotalValue: oldTotalValue,
      newTotalValue: newTotalValue,
      valueDifference: newTotalValue - oldTotalValue,
      updateResults: updateResults
    };

    console.log(`Price update completed: ${successCount} success, ${failCount} failed`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error in update-prices function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
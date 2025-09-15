import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { staticDataService } from '@/services/staticDataService';
import type { DeckDetails } from '@/types';

interface CardBreakdownProps {
  deckId: string;
  deckName: string;
  totalValue: number;
}

export function CardBreakdown({ deckId, deckName, totalValue }: CardBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deckDetails, setDeckDetails] = useState<DeckDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (isOpen && !deckDetails) {
      setIsLoading(true);
      // Use real-time API endpoint instead of cached static data
      fetch(`/api/decks/${deckId}/details`)
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`Failed to fetch deck details: ${response.statusText}`);
          }
        })
        .then(details => {
          if (details) {
            // Convert null fields to undefined for type compatibility
            const convertedDetails = {
              ...details,
              deck: {
                ...details.deck,
                commander: details.deck.commander || undefined
              },
              cards: details.cards.map((card: any) => ({
                ...card,
                setCode: card.setCode || undefined,
                setName: card.setName || undefined,
                manaCost: card.manaCost || undefined,
                type: card.type || undefined,
                rarity: card.rarity || undefined
              }))
            };
            setDeckDetails(convertedDetails);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error loading deck details from real-time API:', error);
          setIsLoading(false);
        });
    }
  }, [isOpen, deckId, deckDetails]);

  const formatPrice = (price: number) => {
    return price > 0 ? `$${price.toFixed(2)}` : 'N/A';
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'rare':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'uncommon':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'common':
        return 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-testid={`button-breakdown-${deckId}`}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2 mt-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground p-2">
            Loading card breakdown...
          </div>
        ) : deckDetails ? (
          <div className="border rounded-lg p-3 space-y-3" data-testid={`breakdown-content-${deckId}`}>
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-medium text-sm">{deckName} - Card Breakdown</h4>
              <Badge variant="outline">
                {deckDetails.cards.length} unique cards
              </Badge>
            </div>
            
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {deckDetails.cards.map((card, index) => (
                <div
                  key={`${card.name}-${index}`}
                  className="flex items-center justify-between p-2 text-xs border rounded hover:bg-accent/50"
                  data-testid={`card-item-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">{card.name}</span>
                      {card.rarity && (
                        <Badge
                          variant="secondary"
                          className={`text-xs px-1 py-0 ${getRarityColor(card.rarity)}`}
                        >
                          {card.rarity[0]?.toUpperCase()}
                        </Badge>
                      )}
                      {card.finish === 'foil' && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Foil
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {card.setName && (
                        <span>{card.setCode ? `${card.setName} (${card.setCode})` : card.setName}</span>
                      )}
                      {card.manaCost && (
                        <span className="ml-2">{card.manaCost}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-right">
                    <div className="text-muted-foreground">
                      {card.quantity}x
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium">
                        {formatPrice(card.totalPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(card.priceUsd)} each
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-2 flex justify-between items-center text-sm">
              <span className="font-medium">Total Deck Value:</span>
              <span className="font-bold">{formatPrice(totalValue)}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-2">
            Failed to load card breakdown
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
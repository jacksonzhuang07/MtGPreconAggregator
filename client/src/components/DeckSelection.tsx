import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Play, CheckSquare, Square } from 'lucide-react';
import type { DeckInfo } from '@/types';

interface DeckSelectionProps {
  decks: DeckInfo[];
  onAnalyzeSelected: (selectedDecks: string[]) => void;
  isAnalyzing?: boolean;
}

export function DeckSelection({ decks, onAnalyzeSelected, isAnalyzing }: DeckSelectionProps) {
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterSet, setFilterSet] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');

  // Extract commander set from deck name (text in parentheses)
  const extractCommanderSet = (deckName: string): string => {
    const match = deckName.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  };

  // Get unique commander sets for filtering
  const availableSets = useMemo(() => {
    const uniqueSets = new Set(decks.map(deck => extractCommanderSet(deck.name)));
    const sets = Array.from(uniqueSets).sort();
    return sets;
  }, [decks]);

  const availableFormats = useMemo(() => {
    const uniqueFormats = new Set(decks.map(deck => deck.format));
    const formats = Array.from(uniqueFormats);
    return formats;
  }, [decks]);

  // Filter decks based on search and filters
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesSearch = searchText === '' || 
        deck.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (deck.commander && deck.commander.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesSet = filterSet === 'all' || extractCommanderSet(deck.name) === filterSet;
      const matchesFormat = filterFormat === 'all' || deck.format === filterFormat;
      
      return matchesSearch && matchesSet && matchesFormat;
    });
  }, [decks, searchText, filterSet, filterFormat]);

  const handleSelectAll = () => {
    if (selectedDecks.length === filteredDecks.length) {
      setSelectedDecks([]);
    } else {
      setSelectedDecks(filteredDecks.map(deck => deck.id));
    }
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDecks(prev => {
      if (prev.includes(deckId)) {
        return prev.filter(id => id !== deckId);
      } else {
        return [...prev, deckId];
      }
    });
  };

  const handleAnalyze = () => {
    onAnalyzeSelected(selectedDecks);
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'commanderprecons':
      case 'commander':
        return 'bg-primary/10 text-primary';
      case 'standardprecons':
      case 'standard':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="mb-8" data-testid="deck-selection">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Commander Decks to Analyze</span>
          <Badge variant="outline" data-testid="total-decks-badge">
            {decks.length} Total Decks
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search-decks">Search Decks</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search-decks"
                type="text"
                placeholder="Search by deck name or commander..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
                data-testid="input-search-decks"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="filter-set">Commander Set</Label>
            <Select value={filterSet} onValueChange={setFilterSet}>
              <SelectTrigger className="w-60" data-testid="select-set">
                <SelectValue placeholder="All Sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sets</SelectItem>
                {availableSets.map(set => (
                  <SelectItem key={set} value={set}>
                    {set}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="filter-format">Format</Label>
            <Select value={filterFormat} onValueChange={setFilterFormat}>
              <SelectTrigger className="w-40" data-testid="select-format">
                <SelectValue placeholder="All Formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {availableFormats.map(format => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center space-x-2"
              data-testid="button-select-all"
            >
              {selectedDecks.length === filteredDecks.length ? 
                <CheckSquare className="h-4 w-4" /> : 
                <Square className="h-4 w-4" />
              }
              <span>
                {selectedDecks.length === filteredDecks.length ? 'Deselect All' : 'Select All'}
              </span>
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedDecks.length} of {filteredDecks.length} selected
            </span>
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={selectedDecks.length === 0 || isAnalyzing}
            className="flex items-center space-x-2"
            data-testid="button-analyze-selected"
          >
            <Play className="h-4 w-4" />
            <span>Analyze Selected Decks ({selectedDecks.length})</span>
          </Button>
        </div>

        {/* Deck List */}
        <ScrollArea className="h-96 border rounded-lg p-4">
          <div className="space-y-3">
            {filteredDecks.map((deck) => (
              <div
                key={deck.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`deck-item-${deck.id}`}
              >
                <Checkbox
                  checked={selectedDecks.includes(deck.id)}
                  onCheckedChange={() => handleSelectDeck(deck.id)}
                  data-testid={`checkbox-deck-${deck.id}`}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm truncate" data-testid={`deck-name-${deck.id}`}>
                      {deck.name}
                    </h4>
                    <Badge className={getFormatBadgeColor(deck.format)}>
                      {deck.format}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Set: {extractCommanderSet(deck.name)}</span>
                    <span>{deck.cardCount} cards</span>
                    {deck.commander && <span>Commander: {deck.commander}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredDecks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No decks match your current filters
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
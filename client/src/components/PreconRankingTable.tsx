import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Download, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DeckRanking } from '@/types';

interface PreconRankingTableProps {
  rankings: DeckRanking[];
  onViewDeck?: (deckId: string) => void;
  onExportDeck?: (deckId: string) => void;
}

export function PreconRankingTable({ 
  rankings, 
  onViewDeck, 
  onExportDeck 
}: PreconRankingTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(rankings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRankings = rankings.slice(startIndex, endIndex);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    if (rank === 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-muted text-muted-foreground';
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'commanderprecons':
      case 'commander':
        return 'bg-primary/10 text-primary';
      case 'standardprecons':
      case 'standard':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'modernprecons':
      case 'modern':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatName = (format: string) => {
    switch (format.toLowerCase()) {
      case 'commanderprecons':
        return 'Commander';
      case 'standardprecons':
        return 'Standard';
      case 'modernprecons':
        return 'Modern';
      default:
        return format;
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <Card data-testid="results-section">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Precon Deck Rankings by Value</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Prices updated from Scryfall API</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>Deck Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Cards</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-center w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRankings.map((ranking) => (
                <TableRow 
                  key={ranking.deck.id} 
                  className="hover:bg-accent/50 transition-colors"
                  data-testid={`row-deck-${ranking.deck.id}`}
                >
                  <TableCell>
                    <div className="flex items-center">
                      <Badge 
                        className={`${getRankBadgeColor(ranking.rank)} font-bold text-xs px-2 py-1`}
                        data-testid={`badge-rank-${ranking.rank}`}
                      >
                        {ranking.rank}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground" data-testid={`text-deck-name-${ranking.deck.id}`}>
                        {ranking.deck.name}
                      </div>
                      {ranking.deck.commander && (
                        <div className="text-sm text-muted-foreground" data-testid={`text-commander-${ranking.deck.id}`}>
                          Commander: {ranking.deck.commander}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={getFormatBadgeColor(ranking.deck.format)}
                      data-testid={`badge-format-${ranking.deck.id}`}
                    >
                      {formatName(ranking.deck.format)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium" data-testid={`text-card-count-${ranking.deck.id}`}>
                      {ranking.deck.cardCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-lg font-bold text-foreground" data-testid={`text-total-value-${ranking.deck.id}`}>
                      {formatCurrency(ranking.totalValue)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {onViewDeck && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDeck(ranking.deck.id)}
                          className="p-1 h-8 w-8"
                          title="View Details"
                          data-testid={`button-view-${ranking.deck.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onExportDeck && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onExportDeck(ranking.deck.id)}
                          className="p-1 h-8 w-8"
                          title="Export Deck"
                          data-testid={`button-export-${ranking.deck.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground" data-testid="pagination-info">
              Showing {startIndex + 1}-{Math.min(endIndex, rankings.length)} of {rankings.length} decks
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center space-x-1"
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8"
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8"
                      data-testid={`button-page-${totalPages}`}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1"
                data-testid="button-next-page"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

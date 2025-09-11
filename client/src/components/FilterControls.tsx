import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import type { FilterOptions } from '@/types';

interface FilterControlsProps {
  onFilterChange: (filters: FilterOptions) => void;
  onExport: () => void;
}

export function FilterControls({ onFilterChange, onExport }: FilterControlsProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    format: '',
    search: '',
    minPrice: undefined,
    maxPrice: undefined,
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const formatOptions = [
    { value: '', label: 'All Formats' },
    { value: 'commanderPrecons', label: 'Commander' },
    { value: 'standardPrecons', label: 'Standard' },
    { value: 'modernPrecons', label: 'Modern' },
  ];

  const priceRangeOptions = [
    { value: '', label: 'All Prices' },
    { value: 'under50', label: 'Under $50', min: 0, max: 50 },
    { value: '50-100', label: '$50 - $100', min: 50, max: 100 },
    { value: '100-200', label: '$100 - $200', min: 100, max: 200 },
    { value: 'over200', label: 'Over $200', min: 200, max: undefined },
  ];

  const handlePriceRangeChange = (value: string) => {
    const option = priceRangeOptions.find(opt => opt.value === value);
    if (option) {
      handleFilterChange('minPrice', option.min);
      handleFilterChange('maxPrice', option.max);
    }
  };

  return (
    <Card className="mb-6" data-testid="filters-section">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <Label htmlFor="format-select" className="text-sm font-medium text-foreground">
                Filter by Format:
              </Label>
              <Select 
                value={filters.format} 
                onValueChange={(value) => handleFilterChange('format', value)}
              >
                <SelectTrigger className="ml-2 w-40" data-testid="select-format">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price-select" className="text-sm font-medium text-foreground">
                Price Range:
              </Label>
              <Select onValueChange={handlePriceRangeChange}>
                <SelectTrigger className="ml-2 w-40" data-testid="select-price-range">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  {priceRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search deck names..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
                data-testid="input-search"
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={onExport}
              className="flex items-center space-x-2"
              data-testid="button-export"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

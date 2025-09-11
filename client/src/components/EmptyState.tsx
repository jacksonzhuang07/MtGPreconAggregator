import { BarChart3, Check } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center py-12" data-testid="empty-state">
      <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
        <BarChart3 className="text-muted-foreground h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Data to Display</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Upload your MTG precon CSV file to begin analyzing deck values and see detailed price rankings.
      </p>
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="flex items-center justify-center space-x-2">
          <Check className="text-primary h-4 w-4" />
          <span>Supports Moxfield CSV exports</span>
        </p>
        <p className="flex items-center justify-center space-x-2">
          <Check className="text-primary h-4 w-4" />
          <span>Real-time Scryfall API pricing</span>
        </p>
        <p className="flex items-center justify-center space-x-2">
          <Check className="text-primary h-4 w-4" />
          <span>Automatic rate limiting</span>
        </p>
      </div>
    </div>
  );
}

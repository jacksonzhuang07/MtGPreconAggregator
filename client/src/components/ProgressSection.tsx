import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle } from 'lucide-react';
import type { AnalysisProgress } from '@/types';

interface ProgressSectionProps {
  progress: AnalysisProgress;
}

export function ProgressSection({ progress }: ProgressSectionProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="mb-8" data-testid="progress-section">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Processing Deck Data</h3>
          <div className="text-sm text-muted-foreground" data-testid="progress-counter">
            <span data-testid="text-current-progress">{progress.current}</span> of{' '}
            <span data-testid="text-total-progress">{progress.total}</span> cards processed
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span data-testid="text-percentage">{progress.percentage}%</span>
            </div>
            <Progress 
              value={progress.percentage} 
              className="w-full"
              data-testid="progress-bar"
            />
          </div>
          
          {/* Current Status */}
          <div className="flex items-center space-x-3 text-sm">
            {getStatusIcon()}
            <span className={getStatusColor()} data-testid="text-status-message">
              {progress.message}
            </span>
          </div>
          
          {/* Rate Limiting Info */}
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Rate limiting: 10 requests per second to ensure API compliance</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

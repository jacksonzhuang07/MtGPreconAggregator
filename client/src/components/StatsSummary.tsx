import { Card, CardContent } from '@/components/ui/card';
import { Layers, CreditCard, DollarSign, Trophy } from 'lucide-react';
import type { AnalysisStats } from '@/types';

interface StatsSummaryProps {
  stats: AnalysisStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const statItems = [
    {
      icon: Layers,
      value: stats.totalDecks.toLocaleString(),
      label: 'Total Precons',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      testId: 'stat-total-decks',
    },
    {
      icon: CreditCard,
      value: stats.uniqueCards.toLocaleString(),
      label: 'Unique Cards',
      bgColor: 'bg-accent/10',
      iconColor: 'text-accent-foreground',
      testId: 'stat-unique-cards',
    },
    {
      icon: DollarSign,
      value: formatCurrency(stats.avgPrice),
      label: 'Average Deck Value',
      bgColor: 'bg-secondary/10',
      iconColor: 'text-secondary-foreground',
      testId: 'stat-avg-price',
    },
    {
      icon: Trophy,
      value: formatCurrency(stats.highestValue),
      label: 'Highest Value',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      testId: 'stat-highest-value',
    },
  ];

  return (
    <div className="mb-8" data-testid="stats-section">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`${item.bgColor} rounded-lg p-2`}>
                  <item.icon className={`${item.iconColor} h-5 w-5`} />
                </div>
                <div>
                  <div 
                    className="text-2xl font-bold text-foreground"
                    data-testid={item.testId}
                  >
                    {item.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

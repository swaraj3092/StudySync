import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down';
  color?: 'primary' | 'accent' | 'warning' | 'success';
  icon?: LucideIcon;
}

const colorConfig = {
  primary: {
    text: 'text-primary',
    border: 'border-l-primary',
    bg: 'bg-primary/5 dark:bg-primary/10',
    iconColor: 'text-primary',
  },
  accent: {
    text: 'text-teal-500',
    border: 'border-l-teal-500',
    bg: 'bg-teal-500/5 dark:bg-teal-500/10',
    iconColor: 'text-teal-500',
  },
  warning: {
    text: 'text-warning',
    border: 'border-l-warning',
    bg: 'bg-warning/5 dark:bg-warning/10',
    iconColor: 'text-warning',
  },
  success: {
    text: 'text-success',
    border: 'border-l-success',
    bg: 'bg-success/5 dark:bg-success/10',
    iconColor: 'text-success',
  },
};

export function MetricCard({ label, value, subtext, trend, color = 'primary', icon: Icon }: MetricCardProps) {
  const config = colorConfig[color];

  return (
    <Card className={`p-6 border-l-4 ${config.border} ${config.bg}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-text-secondary font-medium">{label}</p>
          {Icon && <Icon className={`h-5 w-5 ${config.iconColor}`} strokeWidth={1.5} />}
        </div>
        <p className={`text-4xl font-bold ${config.text}`}>
          {value}
        </p>
        {subtext && (
          <div className="flex items-center gap-1 text-sm">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.5} />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-danger" strokeWidth={1.5} />}
            <span className={trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-secondary'}>
              {subtext}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

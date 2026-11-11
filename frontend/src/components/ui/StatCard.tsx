import React, { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className
}) => {
  return (
    <Card className={cn('flex flex-col justify-between p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <div className="p-2 bg-slate-100 rounded-md text-navy-900">{icon}</div>}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            {trend && (
              <span className={cn('font-semibold', trend.isPositive ? 'text-emerald-600' : 'text-red-600')}>
                {trend.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};


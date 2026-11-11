import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className
}) => {
  const styles = {
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    error: 'bg-red-50 text-red-900 border-red-200',
  };

  const icons = {
    info: <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />,
    success: <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />,
  };

  return (
    <div className={cn('flex gap-3 p-3.5 rounded-md border text-xs', styles[type], className)} role="alert">
      {icons[type]}
      <div className="space-y-0.5">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-slate-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
};


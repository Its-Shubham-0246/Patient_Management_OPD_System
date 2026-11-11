import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, bordered = true, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg p-5 shadow-sm',
        bordered && 'border border-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-slate-100', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-900 tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs text-slate-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('pt-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center pt-4 border-t border-slate-100 mt-4', className)} {...props}>
    {children}
  </div>
);


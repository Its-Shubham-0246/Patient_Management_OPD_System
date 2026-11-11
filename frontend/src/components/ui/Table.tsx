import React, { TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export const Table: React.FC<TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto rounded-md border border-slate-200">
    <table className={cn('w-full caption-bottom text-sm text-left', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600', className)} {...props} />
);

export const TableBody: React.FC<HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props} />
);

export const TableRow: React.FC<HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('hover:bg-slate-50/80 transition-colors', className)} {...props} />
);

export const TableHead: React.FC<ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('h-10 px-4 text-left align-middle font-semibold text-slate-700', className)} {...props} />
);

export const TableCell: React.FC<TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('p-4 align-middle text-slate-700', className)} {...props} />
);

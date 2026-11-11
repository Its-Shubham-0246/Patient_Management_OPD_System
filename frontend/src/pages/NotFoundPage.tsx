import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-4">
      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl mb-4">
        404
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Resource Not Found</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The requested route or medical document does not exist or you do not have permission to access it.
      </p>
      <div className="mt-5">
        <Link to="/">
          <Button variant="primary" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            <span>Return to Clinic Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};


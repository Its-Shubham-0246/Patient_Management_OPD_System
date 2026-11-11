import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 py-2">
      <Link to="/" className="hover:text-slate-900 flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formatted = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3 w-3 mx-1.5 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{formatted}</span>
            ) : (
              <Link to={routeTo} className="hover:text-slate-900">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};


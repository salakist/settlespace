import React from 'react';

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const Routes = ({ children }: { children: React.ReactNode }) => {
  // In tests, render all routes so components are mounted
  return <>{children}</>;
};

export const Route = ({ element }: { path?: string; element: React.ReactNode }) => {
  return <>{element}</>;
};

export const Navigate = ({ to, replace }: { to: string; replace?: boolean }) => null;

export const useNavigate = () => jest.fn();

export const useLocation = () => ({ pathname: '/directory' });




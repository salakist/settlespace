import React from 'react';

let mockPathname = '/home';
const mockNavigate = jest.fn();

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const Routes = ({ children }: { children: React.ReactNode }) => {
  // In tests, render all routes so components are mounted
  return <>{children}</>;
};

export const Route = ({ element }: { path?: string; element: React.ReactNode }) => {
  return <>{element}</>;
};

export const Navigate = ({ to, replace }: { to: string; replace?: boolean }) => null;

export const useNavigate = () => mockNavigate;

export const useLocation = () => ({ pathname: mockPathname });

export const __setMockPathname = (pathname: string) => {
  mockPathname = pathname;
};

export const __resetRouterMocks = () => {
  mockPathname = '/home';
  mockNavigate.mockReset();
};

export const __mockNavigate = mockNavigate;




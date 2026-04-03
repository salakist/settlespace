import React from 'react';

let mockPathname = '/home';
let mockParams: Record<string, string | undefined> = {};
const mockNavigate = jest.fn();

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const Routes = ({ children }: { children: React.ReactNode }) => {
  // In tests, render all routes so components are mounted
  return <>{children}</>;
};

export const Route = ({ element }: { element: React.ReactNode }) => {
  return <>{element}</>;
};

export const Navigate = ({ to, replace }: { to: string; replace?: boolean }) => null;

export const useNavigate = () => mockNavigate;

export const useLocation = () => ({ pathname: mockPathname });

export const useParams = () => mockParams;

export const __setMockPathname = (pathname: string) => {
  mockPathname = pathname;
};

export const __setMockParams = (params: Record<string, string | undefined>) => {
  mockParams = params;
};

export const __resetRouterMocks = () => {
  mockPathname = '/home';
  mockParams = {};
  mockNavigate.mockReset();
};

export const __mockNavigate = mockNavigate;




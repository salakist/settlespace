import React from 'react';

let mockPathname = '/home';
let mockParams: Record<string, string | undefined> = {};
let mockSearchParams = new URLSearchParams();
const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn((nextParams?: string | URLSearchParams | string[][] | Record<string, string>) => {
  if (!nextParams) {
    mockSearchParams = new URLSearchParams();
    return;
  }

  mockSearchParams = new URLSearchParams(
    nextParams instanceof URLSearchParams ? nextParams.toString() : (nextParams as string),
  );
});

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

export const useSearchParams = () => [mockSearchParams, mockSetSearchParams] as const;

export const __setMockPathname = (pathname: string) => {
  mockPathname = pathname;
};

export const __setMockParams = (params: Record<string, string | undefined>) => {
  mockParams = params;
};

export const __setMockSearchParams = (params: string) => {
  mockSearchParams = new URLSearchParams(params);
};

export const __resetRouterMocks = () => {
  mockPathname = '/home';
  mockParams = {};
  mockSearchParams = new URLSearchParams();
  mockNavigate.mockReset();
  mockSetSearchParams.mockReset();
};

export const __mockNavigate = mockNavigate;
export const __mockSetSearchParams = mockSetSearchParams;





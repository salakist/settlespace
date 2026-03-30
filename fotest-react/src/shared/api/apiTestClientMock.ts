import axios from 'axios';

export const mockGet = jest.fn();
export const mockPost = jest.fn();
export const mockPut = jest.fn();
export const mockDelete = jest.fn();
export const mockRequestUse = jest.fn();

export function setupApiClientMock(): void {
  jest.clearAllMocks();
  localStorage.clear();

  (axios.create as jest.Mock).mockReturnValue({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: {
        use: mockRequestUse,
      },
    },
  });
}

import { act, renderHook } from '@testing-library/react';
import useUrlSearchQuery from './useUrlSearchQuery';

const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

const parse = (params: URLSearchParams) => ({ freeText: params.get('freeText') ?? '' });
const serialize = (query: { freeText: string }) => {
  const params = new URLSearchParams();
  if (query.freeText) {
    params.set('freeText', query.freeText);
  }

  return params;
};

beforeEach(() => {
  mockSetSearchParams.mockClear();
  mockUseSearchParams.mockClear();
});

test('parses initial URL search params into a typed query', () => {
  mockUseSearchParams.mockReturnValue([new URLSearchParams('freeText=hello'), mockSetSearchParams]);

  const { result } = renderHook(() => useUrlSearchQuery(parse, serialize));

  expect(result.current[0]).toEqual({ freeText: 'hello' });
});

test('returns an empty value when no params are present', () => {
  mockUseSearchParams.mockReturnValue([new URLSearchParams(''), mockSetSearchParams]);

  const { result } = renderHook(() => useUrlSearchQuery(parse, serialize));

  expect(result.current[0]).toEqual({ freeText: '' });
});

test('calls setSearchParams with serialized params when setter is invoked', () => {
  mockUseSearchParams.mockReturnValue([new URLSearchParams(''), mockSetSearchParams]);

  const { result } = renderHook(() => useUrlSearchQuery(parse, serialize));

  act(() => {
    result.current[1]({ freeText: 'world' });
  });

  const called = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
  expect(called.get('freeText')).toBe('world');
});


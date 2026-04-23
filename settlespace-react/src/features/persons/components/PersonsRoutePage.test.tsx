import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PersonRole } from '../../../shared/types';
import PersonsRoutePage from './PersonsRoutePage';

const mockHandleSearch = jest.fn();
const mockSetQueryToUrl = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/persons' }),
  Navigate: () => null,
}));

jest.mock('../../search/hooks/useUrlSearchQuery', () => ({
  __esModule: true,
  default: () => [{ firstName: ['John'] }, mockSetQueryToUrl],
}));

jest.mock('../hooks/usePersons', () => ({
  usePersons: () => ({
    editingPerson: undefined,
    error: null,
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleSearch: mockHandleSearch,
    loading: false,
    persons: [],
    saveLoading: false,
    showCreateForm: jest.fn(),
    showForm: false,
  }),
}));

jest.mock('./PersonsPage', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (query: Record<string, unknown>) => void }) => (
    <button onClick={() => onSearch({ freeText: 'hello' })}>Search</button>
  ),
}));

beforeEach(() => {
  mockHandleSearch.mockClear();
  mockSetQueryToUrl.mockClear();
});

test('calls handleSearch with query from useUrlSearchQuery on mount', async () => {
  render(
    <PersonsRoutePage
      currentPersonId="p1"
      role={PersonRole.Admin}
      expireSession={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(mockHandleSearch).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: ['John'] }),
    ),
  );
});

test('calls setQueryToUrl when onSearch fires', () => {
  render(
    <PersonsRoutePage
      currentPersonId="p1"
      role={PersonRole.Admin}
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(mockSetQueryToUrl).toHaveBeenCalledWith({ freeText: 'hello' });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PersonAddressEditor, { createEmptyAddress } from './PersonAddressEditor';
import { Address } from '../../../shared/types';

describe('createEmptyAddress', () => {
  test('creates an empty address object', () => {
    expect(createEmptyAddress()).toEqual({
      label: '',
      streetLine1: '',
      streetLine2: '',
      postalCode: '',
      city: '',
      stateOrRegion: '',
      country: '',
    });
  });
});

describe('PersonAddressEditor', () => {
  test('shows empty state and can add an address', () => {
    const onChange = jest.fn();

    render(<PersonAddressEditor addresses={[]} onChange={onChange} />);

    expect(screen.getByText(/No addresses added yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add Address/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([createEmptyAddress()]);
  });

  test('updates and removes an address', () => {
    const onChange = jest.fn();
    const addresses: Address[] = [
      {
        label: 'Home',
        streetLine1: '123 Main',
        streetLine2: '',
        postalCode: '12345',
        city: 'Townsville',
        stateOrRegion: 'State',
        country: 'Country',
      },
    ];

    render(<PersonAddressEditor addresses={addresses} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Label/i), { target: { value: 'Office' } });
    expect(onChange).toHaveBeenCalledWith([
      {
        ...addresses[0],
        label: 'Office',
      },
    ]);

    fireEvent.change(screen.getByLabelText(/Street Line 1/i), { target: { value: '456 Side' } });
    fireEvent.change(screen.getByLabelText(/Street Line 2/i), { target: { value: 'Floor 2' } });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), { target: { value: '54321' } });
    fireEvent.change(screen.getByLabelText(/^City$/i), { target: { value: 'Metro' } });
    fireEvent.change(screen.getByLabelText(/State \/ Region/i), { target: { value: 'Region' } });
    fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'Wonderland' } });

    fireEvent.click(screen.getByRole('button', { name: /remove address 1/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test('respects disabled state for add and remove actions', () => {
    const onChange = jest.fn();
    const addresses: Address[] = [createEmptyAddress()];

    render(<PersonAddressEditor addresses={addresses} onChange={onChange} disabled />);

    expect(screen.getByRole('button', { name: /Add Address/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /remove address 1/i })).toBeDisabled();
  });
});

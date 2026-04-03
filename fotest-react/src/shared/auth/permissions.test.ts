import {
  canAccessPersonsPage,
  canCreatePerson,
  canCreateTransaction,
  canDeletePerson,
  canEditRole,
  canReadTransaction,
  canUpdateOrDeleteTransaction,
  canUpdatePerson,
} from './permissions';
import { Person, PersonRole, Transaction } from '../types';

function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    addresses: [],
    ...overrides,
  };
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    payerPersonId: 'payer-1',
    payeePersonId: 'payee-1',
    createdByPersonId: 'creator-1',
    amount: 12.5,
    currencyCode: 'EUR',
    transactionDateUtc: '2026-01-01T00:00:00Z',
    description: 'Lunch',
    status: 'Completed',
    ...overrides,
  };
}

describe('permissions', () => {
  test.each<[PersonRole | null, boolean]>([
    ['ADMIN', true],
    ['MANAGER', true],
    ['USER', false],
    [null, false],
  ])('canAccessPersonsPage returns %s => %s', (role, expected) => {
    expect(canAccessPersonsPage(role)).toBe(expected);
  });

  test('canCreatePerson allows admins, limits managers to USER, and blocks everyone else', () => {
    expect(canCreatePerson('ADMIN', 'ADMIN')).toBe(true);
    expect(canCreatePerson('ADMIN', 'USER')).toBe(true);
    expect(canCreatePerson('MANAGER', 'USER')).toBe(true);
    expect(canCreatePerson('MANAGER', 'MANAGER')).toBe(false);
    expect(canCreatePerson('USER', 'USER')).toBe(false);
    expect(canCreatePerson(null, 'USER')).toBe(false);
  });

  test('canUpdatePerson blocks missing ids and self role changes', () => {
    expect(
      canUpdatePerson('ADMIN', 'person-1', createPerson({ id: undefined }), 'USER'),
    ).toBe(false);

    expect(
      canUpdatePerson('ADMIN', 'person-1', createPerson({ id: 'person-1', role: 'USER' }), 'MANAGER'),
    ).toBe(false);
  });

  test('canUpdatePerson allows admins and only allows managers to keep USER targets as USER', () => {
    expect(
      canUpdatePerson('ADMIN', 'current-user', createPerson({ id: 'person-2', role: undefined }), 'USER'),
    ).toBe(true);

    expect(
      canUpdatePerson('MANAGER', 'manager-1', createPerson({ id: 'user-1', role: 'USER' }), 'USER'),
    ).toBe(true);

    expect(
      canUpdatePerson('MANAGER', 'manager-1', createPerson({ id: 'user-1', role: 'USER' }), 'MANAGER'),
    ).toBe(false);

    expect(
      canUpdatePerson('MANAGER', 'manager-1', createPerson({ id: 'admin-1', role: 'ADMIN' }), 'ADMIN'),
    ).toBe(false);

    expect(
      canUpdatePerson('USER', 'user-1', createPerson({ id: 'user-2', role: 'USER' }), 'USER'),
    ).toBe(false);
  });

  test('canDeletePerson respects admin and manager boundaries', () => {
    expect(canDeletePerson('ADMIN', createPerson({ role: 'MANAGER' }))).toBe(true);
    expect(canDeletePerson('MANAGER', createPerson({ role: 'USER' }))).toBe(true);
    expect(canDeletePerson('MANAGER', createPerson({ role: 'ADMIN' }))).toBe(false);
    expect(canDeletePerson('USER', createPerson({ role: 'USER' }))).toBe(false);
  });

  test.each<[PersonRole | null, boolean]>([
    ['ADMIN', true],
    ['MANAGER', false],
    ['USER', false],
    [null, false],
  ])('canEditRole returns %s => %s', (role, expected) => {
    expect(canEditRole(role)).toBe(expected);
  });

  test('canReadTransaction allows admins, managers who are involved or creators, and users who are involved', () => {
    const managerCreated = createTransaction({
      payerPersonId: 'payer-1',
      payeePersonId: 'payee-1',
      createdByPersonId: 'manager-1',
    });
    const managerInvolved = createTransaction({
      payerPersonId: 'manager-1',
      payeePersonId: 'payee-1',
      createdByPersonId: 'creator-2',
    });
    const unrelatedTransaction = createTransaction({
      payerPersonId: 'payer-2',
      payeePersonId: 'payee-2',
      createdByPersonId: 'creator-2',
    });
    const userInvolved = createTransaction({
      payerPersonId: 'user-1',
      payeePersonId: 'payee-3',
      createdByPersonId: 'creator-3',
    });
    const userCreatedOnly = createTransaction({
      payerPersonId: 'payer-3',
      payeePersonId: 'payee-3',
      createdByPersonId: 'user-1',
    });

    expect(canReadTransaction('ADMIN', undefined, unrelatedTransaction)).toBe(true);
    expect(canReadTransaction('MANAGER', 'manager-1', managerCreated)).toBe(true);
    expect(canReadTransaction('MANAGER', 'manager-1', managerInvolved)).toBe(true);
    expect(canReadTransaction('MANAGER', 'manager-1', unrelatedTransaction)).toBe(false);
    expect(canReadTransaction('USER', 'user-1', userInvolved)).toBe(true);
    expect(canReadTransaction('USER', 'user-1', userCreatedOnly)).toBe(false);
    expect(canReadTransaction('USER', undefined, userInvolved)).toBe(false);
  });

  test('canCreateTransaction allows admins/managers and only involved users', () => {
    expect(canCreateTransaction('ADMIN', undefined, 'payer-1', 'payee-1')).toBe(true);
    expect(canCreateTransaction('MANAGER', undefined, 'payer-1', 'payee-1')).toBe(true);
    expect(canCreateTransaction('USER', 'user-1', 'user-1', 'payee-1')).toBe(true);
    expect(canCreateTransaction('USER', 'user-1', 'payer-1', 'user-1')).toBe(true);
    expect(canCreateTransaction('USER', 'user-1', 'payer-1', 'payee-1')).toBe(false);
    expect(canCreateTransaction('USER', undefined, 'user-1', 'payee-1')).toBe(false);
  });

  test('canUpdateOrDeleteTransaction allows admins and creators only', () => {
    const ownTransaction = createTransaction({ createdByPersonId: 'user-1' });
    const othersTransaction = createTransaction({ createdByPersonId: 'user-2' });

    expect(canUpdateOrDeleteTransaction('ADMIN', undefined, othersTransaction)).toBe(true);
    expect(canUpdateOrDeleteTransaction('MANAGER', 'user-1', ownTransaction)).toBe(true);
    expect(canUpdateOrDeleteTransaction('USER', 'user-1', ownTransaction)).toBe(true);
    expect(canUpdateOrDeleteTransaction('USER', 'user-1', othersTransaction)).toBe(false);
    expect(canUpdateOrDeleteTransaction('USER', undefined, ownTransaction)).toBe(false);
  });
});

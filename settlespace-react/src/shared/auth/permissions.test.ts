import {
  canAccessPersonsPage,
  canConfirmTransaction,
  canCreatePerson,
  canCreateTransaction,
  canDeletePerson,
  canDeleteTransaction,
  canEditRole,
  canReadTransaction,
  canRefuseTransaction,
  canUpdateOrDeleteTransaction,
  canUpdatePerson,
  canUpdateTransaction,
} from './permissions';
import { Person, PersonRole, Transaction, TransactionStatus } from '../types';

function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    firstName: 'John',
    lastName: 'Doe',
    role: PersonRole.User,
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
    status: TransactionStatus.Completed,
    ...overrides,
  };
}

describe('permissions', () => {
  test.each<[PersonRole | null, boolean]>([
    [PersonRole.Admin, true],
    [PersonRole.Manager, true],
    [PersonRole.User, false],
    [null, false],
  ])('canAccessPersonsPage returns %s => %s', (role, expected) => {
    expect(canAccessPersonsPage(role)).toBe(expected);
  });

  test('canCreatePerson allows admins, limits managers to USER, and blocks everyone else', () => {
    expect(canCreatePerson(PersonRole.Admin, PersonRole.Admin)).toBe(true);
    expect(canCreatePerson(PersonRole.Admin, PersonRole.User)).toBe(true);
    expect(canCreatePerson(PersonRole.Manager, PersonRole.User)).toBe(true);
    expect(canCreatePerson(PersonRole.Manager, PersonRole.Manager)).toBe(false);
    expect(canCreatePerson(PersonRole.User, PersonRole.User)).toBe(false);
    expect(canCreatePerson(null, PersonRole.User)).toBe(false);
  });

  test('canUpdatePerson blocks missing ids and self role changes', () => {
    expect(
      canUpdatePerson(PersonRole.Admin, 'person-1', createPerson({ id: undefined }), PersonRole.User),
    ).toBe(false);

    expect(
      canUpdatePerson(
        PersonRole.Admin,
        'person-1',
        createPerson({ id: 'person-1', role: PersonRole.User }),
        PersonRole.Manager,
      ),
    ).toBe(false);
  });

  test('canUpdatePerson allows admins and only allows managers to keep USER targets as USER', () => {
    expect(
      canUpdatePerson(PersonRole.Admin, 'current-user', createPerson({ id: 'person-2', role: undefined }), PersonRole.User),
    ).toBe(true);

    expect(
      canUpdatePerson(PersonRole.Manager, 'manager-1', createPerson({ id: 'user-1', role: PersonRole.User }), PersonRole.User),
    ).toBe(true);

    expect(
      canUpdatePerson(PersonRole.Manager, 'manager-1', createPerson({ id: 'user-1', role: PersonRole.User }), PersonRole.Manager),
    ).toBe(false);

    expect(
      canUpdatePerson(PersonRole.Manager, 'manager-1', createPerson({ id: 'admin-1', role: PersonRole.Admin }), PersonRole.Admin),
    ).toBe(false);

    expect(
      canUpdatePerson(PersonRole.User, 'user-1', createPerson({ id: 'user-2', role: PersonRole.User }), PersonRole.User),
    ).toBe(false);
  });

  test('canDeletePerson respects admin and manager boundaries', () => {
    expect(canDeletePerson(PersonRole.Admin, createPerson({ role: PersonRole.Manager }))).toBe(true);
    expect(canDeletePerson(PersonRole.Manager, createPerson({ role: PersonRole.User }))).toBe(true);
    expect(canDeletePerson(PersonRole.Manager, createPerson({ role: PersonRole.Admin }))).toBe(false);
    expect(canDeletePerson(PersonRole.User, createPerson({ role: PersonRole.User }))).toBe(false);
  });

  test.each<[PersonRole | null, boolean]>([
    [PersonRole.Admin, true],
    [PersonRole.Manager, false],
    [PersonRole.User, false],
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

    expect(canReadTransaction(PersonRole.Admin, undefined, unrelatedTransaction)).toBe(true);
    expect(canReadTransaction(PersonRole.Manager, 'manager-1', managerCreated)).toBe(true);
    expect(canReadTransaction(PersonRole.Manager, 'manager-1', managerInvolved)).toBe(true);
    expect(canReadTransaction(PersonRole.Manager, 'manager-1', unrelatedTransaction)).toBe(false);
    expect(canReadTransaction(PersonRole.User, 'user-1', userInvolved)).toBe(true);
    expect(canReadTransaction(PersonRole.User, 'user-1', userCreatedOnly)).toBe(false);
    expect(canReadTransaction(PersonRole.User, undefined, userInvolved)).toBe(false);
  });

  test('canCreateTransaction allows admins/managers and only involved users', () => {
    expect(canCreateTransaction(PersonRole.Admin, undefined, 'payer-1', 'payee-1')).toBe(true);
    expect(canCreateTransaction(PersonRole.Manager, undefined, 'payer-1', 'payee-1')).toBe(true);
    expect(canCreateTransaction(PersonRole.User, 'user-1', 'user-1', 'payee-1')).toBe(true);
    expect(canCreateTransaction(PersonRole.User, 'user-1', 'payer-1', 'user-1')).toBe(true);
    expect(canCreateTransaction(PersonRole.User, 'user-1', 'payer-1', 'payee-1')).toBe(false);
    expect(canCreateTransaction(PersonRole.User, undefined, 'user-1', 'payee-1')).toBe(false);
  });

  test('canUpdateOrDeleteTransaction returns true if canUpdate or canDelete is true', () => {
    const pendingOwn = createTransaction({ createdByPersonId: 'user-1', status: TransactionStatus.Pending });
    const completedOwn = createTransaction({ createdByPersonId: 'user-1', status: TransactionStatus.Completed });
    const othersTransaction = createTransaction({ createdByPersonId: 'user-2', status: TransactionStatus.Completed });

    expect(canUpdateOrDeleteTransaction(PersonRole.Admin, undefined, othersTransaction)).toBe(true);
    expect(canUpdateOrDeleteTransaction(PersonRole.Manager, 'user-1', completedOwn)).toBe(true);
    expect(canUpdateOrDeleteTransaction(PersonRole.User, 'user-1', pendingOwn)).toBe(true);
    expect(canUpdateOrDeleteTransaction(PersonRole.User, 'user-1', completedOwn)).toBe(false);
    expect(canUpdateOrDeleteTransaction(PersonRole.User, undefined, pendingOwn)).toBe(false);
  });

  test('canUpdateTransaction allows admins always, managers and users only when creator, users only on Pending', () => {
    const pendingOwn = createTransaction({ createdByPersonId: 'user-1', status: TransactionStatus.Pending });
    const completedOwn = createTransaction({ createdByPersonId: 'user-1', status: TransactionStatus.Completed });
    const pendingOthers = createTransaction({ createdByPersonId: 'user-2', status: TransactionStatus.Pending });

    expect(canUpdateTransaction(PersonRole.Admin, undefined, completedOwn)).toBe(true);
    expect(canUpdateTransaction(PersonRole.Manager, 'user-1', pendingOwn)).toBe(true);
    expect(canUpdateTransaction(PersonRole.Manager, 'user-1', completedOwn)).toBe(true);
    expect(canUpdateTransaction(PersonRole.Manager, 'user-1', pendingOthers)).toBe(false);
    expect(canUpdateTransaction(PersonRole.User, 'user-1', pendingOwn)).toBe(true);
    expect(canUpdateTransaction(PersonRole.User, 'user-1', completedOwn)).toBe(false);
    expect(canUpdateTransaction(PersonRole.User, 'user-2', pendingOwn)).toBe(false);
    expect(canUpdateTransaction(PersonRole.User, undefined, pendingOwn)).toBe(false);
  });

  test('canDeleteTransaction blocks users always, allows managers and admins by creator rule', () => {
    const ownTransaction = createTransaction({ createdByPersonId: 'user-1' });
    const othersTransaction = createTransaction({ createdByPersonId: 'user-2' });

    expect(canDeleteTransaction(PersonRole.Admin, undefined, othersTransaction)).toBe(true);
    expect(canDeleteTransaction(PersonRole.Manager, 'user-1', ownTransaction)).toBe(true);
    expect(canDeleteTransaction(PersonRole.Manager, 'user-1', othersTransaction)).toBe(false);
    expect(canDeleteTransaction(PersonRole.User, 'user-1', ownTransaction)).toBe(false);
    expect(canDeleteTransaction(PersonRole.User, undefined, ownTransaction)).toBe(false);
  });

  test('canConfirmTransaction allows involved, pending, not-yet-confirmed persons only', () => {
    const pending = createTransaction({
      payerPersonId: 'payer-1',
      payeePersonId: 'payee-1',
      status: TransactionStatus.Pending,
      confirmedByPersonIds: [],
    });
    const pendingPayerConfirmed = createTransaction({
      payerPersonId: 'payer-1',
      payeePersonId: 'payee-1',
      status: TransactionStatus.Pending,
      confirmedByPersonIds: ['payer-1'],
    });
    const completed = createTransaction({
      payerPersonId: 'payer-1',
      payeePersonId: 'payee-1',
      status: TransactionStatus.Completed,
      confirmedByPersonIds: [],
    });

    expect(canConfirmTransaction(PersonRole.User, 'payee-1', pending)).toBe(true);
    expect(canConfirmTransaction(PersonRole.User, 'payer-1', pending)).toBe(true);
    expect(canConfirmTransaction(PersonRole.User, 'payer-1', pendingPayerConfirmed)).toBe(false);
    expect(canConfirmTransaction(PersonRole.User, 'other-1', pending)).toBe(false);
    expect(canConfirmTransaction(PersonRole.User, 'payee-1', completed)).toBe(false);
    expect(canConfirmTransaction(PersonRole.User, undefined, pending)).toBe(false);
  });

  test('canRefuseTransaction has same rules as canConfirmTransaction', () => {
    const pending = createTransaction({
      payerPersonId: 'payer-1',
      payeePersonId: 'payee-1',
      status: TransactionStatus.Pending,
      confirmedByPersonIds: [],
    });
    const alreadyConfirmedByPayer = createTransaction({
      payerPersonId: 'payer-1',
      payeePersonId: 'payee-1',
      status: TransactionStatus.Pending,
      confirmedByPersonIds: ['payer-1'],
    });

    expect(canRefuseTransaction(PersonRole.User, 'payee-1', pending)).toBe(true);
    expect(canRefuseTransaction(PersonRole.User, 'payer-1', alreadyConfirmedByPayer)).toBe(false);
    expect(canRefuseTransaction(PersonRole.User, 'other-1', pending)).toBe(false);
  });
});

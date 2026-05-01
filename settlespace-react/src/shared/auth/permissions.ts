import { Person, PersonRole, Transaction, TransactionStatus } from '../types';

export function canAccessPersonsPage(role: PersonRole | null): boolean {
  return role === PersonRole.Admin || role === PersonRole.Manager;
}

export function canCreatePerson(role: PersonRole | null, targetRole: PersonRole): boolean {
  if (role === PersonRole.Admin) {
    return true;
  }

  if (role === PersonRole.Manager) {
    return targetRole === PersonRole.User;
  }

  return false;
}

export function canUpdatePerson(role: PersonRole | null, currentPersonId: string | undefined, target: Person, requestedRole: PersonRole): boolean {
  if (!target.id) {
    return false;
  }

  if (currentPersonId && target.id === currentPersonId && target.role && target.role !== requestedRole) {
    return false;
  }

  if (role === PersonRole.Admin) {
    return true;
  }

  if (role === PersonRole.Manager) {
    return target.role === PersonRole.User && requestedRole === PersonRole.User;
  }

  return false;
}

export function canDeletePerson(role: PersonRole | null, target: Person): boolean {
  if (role === PersonRole.Admin) {
    return true;
  }

  if (role === PersonRole.Manager) {
    return target.role === PersonRole.User;
  }

  return false;
}

export function canEditRole(role: PersonRole | null): boolean {
  return role === PersonRole.Admin;
}

export function canReadTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  if (role === PersonRole.Admin) {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  const involved = transaction.payerPersonId === currentPersonId || transaction.payeePersonId === currentPersonId;
  const created = transaction.createdByPersonId === currentPersonId;

  if (role === PersonRole.Manager) {
    return involved || created;
  }

  return involved;
}

export function canCreateTransaction(role: PersonRole | null, currentPersonId: string | undefined, payerPersonId: string, payeePersonId: string): boolean {
  if (role === PersonRole.Admin || role === PersonRole.Manager) {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  return payerPersonId === currentPersonId || payeePersonId === currentPersonId;
}

export function canUpdateTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  if (role === PersonRole.Admin) {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  if (transaction.createdByPersonId !== currentPersonId) {
    return false;
  }

  if (role === PersonRole.User) {
    return transaction.status === TransactionStatus.Pending;
  }

  return true;
}

export function canDeleteTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  if (role === PersonRole.User) {
    return false;
  }

  if (role === PersonRole.Admin) {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  return transaction.createdByPersonId === currentPersonId;
}

export function canUpdateOrDeleteTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  return canUpdateTransaction(role, currentPersonId, transaction) || canDeleteTransaction(role, currentPersonId, transaction);
}

export function canConfirmTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  if (!currentPersonId) {
    return false;
  }

  if (transaction.status !== TransactionStatus.Pending) {
    return false;
  }

  const involved =
    transaction.payerPersonId === currentPersonId ||
    transaction.payeePersonId === currentPersonId;

  if (!involved) {
    return false;
  }

  return !(transaction.confirmedByPersonIds ?? []).includes(currentPersonId);
}

export function canRefuseTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  return canConfirmTransaction(role, currentPersonId, transaction);
}

import { Person, PersonRole, Transaction } from '../types';

export function canAccessPersonsPage(role: PersonRole | null): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canCreatePerson(role: PersonRole | null, targetRole: PersonRole): boolean {
  if (role === 'ADMIN') {
    return true;
  }

  if (role === 'MANAGER') {
    return targetRole === 'USER';
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

  if (role === 'ADMIN') {
    return true;
  }

  if (role === 'MANAGER') {
    return target.role === 'USER' && requestedRole === 'USER';
  }

  return false;
}

export function canDeletePerson(role: PersonRole | null, target: Person): boolean {
  if (role === 'ADMIN') {
    return true;
  }

  if (role === 'MANAGER') {
    return target.role === 'USER';
  }

  return false;
}

export function canEditRole(role: PersonRole | null): boolean {
  return role === 'ADMIN';
}

export function canReadTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  if (role === 'ADMIN') {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  const involved = transaction.payerPersonId === currentPersonId || transaction.payeePersonId === currentPersonId;
  const created = transaction.createdByPersonId === currentPersonId;

  if (role === 'MANAGER') {
    return involved || created;
  }

  return involved;
}

export function canCreateTransaction(role: PersonRole | null, currentPersonId: string | undefined, payerPersonId: string, payeePersonId: string): boolean {
  if (role === 'ADMIN' || role === 'MANAGER') {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  return payerPersonId === currentPersonId || payeePersonId === currentPersonId;
}

export function canUpdateOrDeleteTransaction(role: PersonRole | null, currentPersonId: string | undefined, transaction: Transaction): boolean {
  if (role === 'ADMIN') {
    return true;
  }

  if (!currentPersonId) {
    return false;
  }

  return transaction.createdByPersonId === currentPersonId;
}

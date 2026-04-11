import { PersonRole } from '../../../shared/types';

export interface PersonSearchQuery {
  freeText?: string;
  firstName?: string[];
  lastName?: string[];
  phoneNumber?: string[];
  email?: string[];
  role?: PersonRole[];
  dateOfBirth?: string[];
  address?: string[];
  postalCode?: string[];
  city?: string[];
  stateOrRegion?: string[];
  country?: string[];
}

function hasValues(values?: readonly unknown[]): boolean {
  return Boolean(values?.length);
}

export function isEmptyPersonSearchQuery(query: PersonSearchQuery): boolean {
  return !query.freeText?.trim()
    && !hasValues(query.firstName)
    && !hasValues(query.lastName)
    && !hasValues(query.phoneNumber)
    && !hasValues(query.email)
    && !hasValues(query.role)
    && !hasValues(query.dateOfBirth)
    && !hasValues(query.address)
    && !hasValues(query.postalCode)
    && !hasValues(query.city)
    && !hasValues(query.stateOrRegion)
    && !hasValues(query.country);
}

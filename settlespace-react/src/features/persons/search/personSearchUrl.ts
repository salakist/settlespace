import { parsePersonRole } from '../../../shared/types';
import { PersonSearchQuery } from './personSearchTypes';

function appendAll(params: URLSearchParams, key: string, values?: string[]): void {
  if (values) {
    for (const v of values) {
      params.append(key, v);
    }
  }
}

export function parsePersonSearchQuery(params: URLSearchParams): PersonSearchQuery {
  const query: PersonSearchQuery = {};

  const freeText = params.get('freeText')?.trim();
  if (freeText) {
    query.freeText = freeText;
  }

  const firstName = params.getAll('firstName');
  if (firstName.length > 0) {
    query.firstName = firstName;
  }

  const lastName = params.getAll('lastName');
  if (lastName.length > 0) {
    query.lastName = lastName;
  }

  const phoneNumber = params.getAll('phoneNumber');
  if (phoneNumber.length > 0) {
    query.phoneNumber = phoneNumber;
  }

  const email = params.getAll('email');
  if (email.length > 0) {
    query.email = email;
  }

  const role = params.getAll('role')
    .map((r) => parsePersonRole(r))
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (role.length > 0) {
    query.role = role;
  }

  const dateOfBirth = params.getAll('dateOfBirth');
  if (dateOfBirth.length > 0) {
    query.dateOfBirth = dateOfBirth;
  }

  const dateOfBirthBefore = params.get('dateOfBirthBefore');
  if (dateOfBirthBefore) {
    query.dateOfBirthBefore = dateOfBirthBefore;
  }

  const dateOfBirthAfter = params.get('dateOfBirthAfter');
  if (dateOfBirthAfter) {
    query.dateOfBirthAfter = dateOfBirthAfter;
  }

  const address = params.getAll('address');
  if (address.length > 0) {
    query.address = address;
  }

  const postalCode = params.getAll('postalCode');
  if (postalCode.length > 0) {
    query.postalCode = postalCode;
  }

  const city = params.getAll('city');
  if (city.length > 0) {
    query.city = city;
  }

  const stateOrRegion = params.getAll('stateOrRegion');
  if (stateOrRegion.length > 0) {
    query.stateOrRegion = stateOrRegion;
  }

  const country = params.getAll('country');
  if (country.length > 0) {
    query.country = country;
  }

  return query;
}

export function serializePersonSearchQuery(query: PersonSearchQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.freeText) {
    params.set('freeText', query.freeText);
  }

  appendAll(params, 'firstName', query.firstName);
  appendAll(params, 'lastName', query.lastName);
  appendAll(params, 'phoneNumber', query.phoneNumber);
  appendAll(params, 'email', query.email);
  appendAll(params, 'role', query.role);
  appendAll(params, 'dateOfBirth', query.dateOfBirth);

  if (query.dateOfBirthBefore) {
    params.set('dateOfBirthBefore', query.dateOfBirthBefore);
  }

  if (query.dateOfBirthAfter) {
    params.set('dateOfBirthAfter', query.dateOfBirthAfter);
  }

  appendAll(params, 'address', query.address);
  appendAll(params, 'postalCode', query.postalCode);
  appendAll(params, 'city', query.city);
  appendAll(params, 'stateOrRegion', query.stateOrRegion);
  appendAll(params, 'country', query.country);

  return params;
}

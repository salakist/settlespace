import { Address, Person } from '../../../shared/types';

export interface PersonDetailsFormValues {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  addresses: Address[];
}

export interface PersonDetailsValidationErrors {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  addresses?: string;
}

const PHONE_NUMBER_REGEX = /^(?=.*\d)[0-9+()\-.\s]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const POSTAL_CODE_REGEX = /^[A-Za-z0-9\-\s]{3,12}$/;

function trimValue(value?: string): string {
  return value?.trim() ?? '';
}

export function normalizeDateInput(value?: string): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

export function createPersonDetailsValues(person?: Person): PersonDetailsFormValues {
  return {
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    phoneNumber: person?.phoneNumber ?? '',
    email: person?.email ?? '',
    dateOfBirth: normalizeDateInput(person?.dateOfBirth),
    addresses: person?.addresses ?? [],
  };
}

function sanitizeAddress(address: Address): Address {
  return {
    label: trimValue(address.label),
    streetLine1: trimValue(address.streetLine1),
    streetLine2: trimValue(address.streetLine2) || undefined,
    postalCode: trimValue(address.postalCode),
    city: trimValue(address.city),
    stateOrRegion: trimValue(address.stateOrRegion) || undefined,
    country: trimValue(address.country),
  };
}

function isAddressEmpty(address: Address): boolean {
  const sanitized = sanitizeAddress(address);
  return !Object.values(sanitized).some(Boolean);
}

export function sanitizeAddresses(addresses: Address[]): Address[] {
  return addresses
    .map(sanitizeAddress)
    .filter((address) => !isAddressEmpty(address));
}

export function toPersonPayload(values: PersonDetailsFormValues): Omit<Person, 'id'> {
  return {
    firstName: trimValue(values.firstName),
    lastName: trimValue(values.lastName),
    phoneNumber: trimValue(values.phoneNumber) || undefined,
    email: trimValue(values.email) || undefined,
    dateOfBirth: values.dateOfBirth || undefined,
    addresses: sanitizeAddresses(values.addresses),
  };
}

export function validatePersonDetails(values: PersonDetailsFormValues): PersonDetailsValidationErrors {
  const errors: PersonDetailsValidationErrors = {};
  const trimmedFirstName = trimValue(values.firstName);
  const trimmedLastName = trimValue(values.lastName);
  const trimmedPhoneNumber = trimValue(values.phoneNumber);
  const trimmedEmail = trimValue(values.email);
  const todayIsoDate = new Date().toISOString().slice(0, 10);

  if (!trimmedFirstName) {
    errors.firstName = 'First name is required.';
  }

  if (!trimmedLastName) {
    errors.lastName = 'Last name is required.';
  }

  if (trimmedPhoneNumber && !PHONE_NUMBER_REGEX.test(trimmedPhoneNumber)) {
    errors.phoneNumber = 'Phone number must be 7-20 characters and contain at least one digit.';
  }

  if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (values.dateOfBirth) {
    if (!DATE_REGEX.test(values.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must be in YYYY-MM-DD format.';
    } else if (values.dateOfBirth > todayIsoDate) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.';
    }
  }

  const addressValidationMessages: string[] = [];
  values.addresses.forEach((address, index) => {
    const sanitized = sanitizeAddress(address);
    if (isAddressEmpty(sanitized)) {
      return;
    }

    const missingFields: string[] = [];
    if (!sanitized.label) {
      missingFields.push('label');
    }
    if (!sanitized.streetLine1) {
      missingFields.push('street line 1');
    }
    if (!sanitized.postalCode) {
      missingFields.push('postal code');
    }
    if (!sanitized.city) {
      missingFields.push('city');
    }
    if (!sanitized.country) {
      missingFields.push('country');
    }

    if (missingFields.length > 0) {
      addressValidationMessages.push(`Address ${index + 1} is missing: ${missingFields.join(', ')}.`);
      return;
    }

    if (!POSTAL_CODE_REGEX.test(sanitized.postalCode)) {
      addressValidationMessages.push(`Address ${index + 1} has an invalid postal code.`);
    }
  });

  if (addressValidationMessages.length > 0) {
    errors.addresses = addressValidationMessages[0];
  }

  return errors;
}

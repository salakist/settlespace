import {
  createPersonDetailsValues,
  sanitizeAddresses,
  toPersonPayload,
  validatePersonDetails,
} from './personDetailsFormUtils';

const FIRST_NAME = 'John';
const LAST_NAME = 'Doe';
const DATE_OF_BIRTH = '1990-01-01';
const EMAIL = 'john@doe.com';

describe('personDetailsFormUtils', () => {
  test('createPersonDetailsValues maps person data and normalizes date', () => {
    const values = createPersonDetailsValues({
      id: 'p1',
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      phoneNumber: '123',
      email: EMAIL,
      dateOfBirth: '1990-01-01T00:00:00Z',
      addresses: [],
    });

    expect(values).toEqual({
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      phoneNumber: '123',
      email: EMAIL,
      dateOfBirth: DATE_OF_BIRTH,
      addresses: [],
    });
  });

  test('sanitizeAddresses removes empty rows and trims values', () => {
    const addresses = sanitizeAddresses([
      {
        label: ' Home ',
        streetLine1: ' 123 Main ',
        streetLine2: ' ',
        postalCode: ' 12345 ',
        city: ' Town ',
        stateOrRegion: ' ',
        country: ' US ',
      },
      {
        label: '',
        streetLine1: '',
        streetLine2: '',
        postalCode: '',
        city: '',
        stateOrRegion: '',
        country: '',
      },
    ]);

    expect(addresses).toEqual([
      {
        label: 'Home',
        streetLine1: '123 Main',
        streetLine2: undefined,
        postalCode: '12345',
        city: 'Town',
        stateOrRegion: undefined,
        country: 'US',
      },
    ]);
  });

  test('toPersonPayload trims optional fields and sanitizes addresses', () => {
    const payload = toPersonPayload({
      firstName: ` ${FIRST_NAME} `,
      lastName: ` ${LAST_NAME} `,
      phoneNumber: ' ',
      email: ' john@doe.com ',
      dateOfBirth: DATE_OF_BIRTH,
      addresses: [
        {
          label: ' Home ',
          streetLine1: ' 123 Main ',
          streetLine2: '',
          postalCode: ' 12345 ',
          city: ' Town ',
          stateOrRegion: '',
          country: ' US ',
        },
      ],
    });

    expect(payload).toEqual({
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      phoneNumber: undefined,
      email: EMAIL,
      dateOfBirth: DATE_OF_BIRTH,
      addresses: [
        {
          label: 'Home',
          streetLine1: '123 Main',
          streetLine2: undefined,
          postalCode: '12345',
          city: 'Town',
          stateOrRegion: undefined,
          country: 'US',
        },
      ],
    });
  });

  test('validatePersonDetails returns field and address errors', () => {
    const errors = validatePersonDetails({
      firstName: '',
      lastName: '',
      phoneNumber: '12',
      email: 'invalid-email',
      dateOfBirth: '2999-12-31',
      addresses: [
        {
          label: 'Office',
          streetLine1: '',
          streetLine2: '',
          postalCode: '',
          city: 'City',
          stateOrRegion: '',
          country: '',
        },
      ],
    });

    expect(errors.firstName).toMatch(/required/i);
    expect(errors.lastName).toMatch(/required/i);
    expect(errors.phoneNumber).toMatch(/7-20/i);
    expect(errors.email).toMatch(/valid email/i);
    expect(errors.dateOfBirth).toMatch(/future/i);
    expect(errors.addresses).toMatch(/Address 1 is missing/i);
  });
});

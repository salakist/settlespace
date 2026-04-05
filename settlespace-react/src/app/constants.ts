import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import ErrorIcon from '@mui/icons-material/Error';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

export const APP_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/home',
  PERSONS: '/persons',
  PERSON_CREATE: '/persons/new',
  PERSON_EDIT: '/persons/:personId/edit',
  PROFILE: '/profile',
  TRANSACTIONS: '/transactions',
  TRANSACTION_CREATE: '/transactions/new',
  TRANSACTION_EDIT: '/transactions/:transactionId/edit',
  DEBTS: '/debts',
  DEBT_DETAILS: '/debts/:counterpartyPersonId/:currencyCode',
} as const;

export const PRIMARY_TABS = [
  { label: 'Home', value: APP_ROUTES.HOME, icon: HomeIcon },
  { label: 'Persons', value: APP_ROUTES.PERSONS, icon: GroupIcon },
  { label: 'Transactions', value: APP_ROUTES.TRANSACTIONS, icon: CompareArrowsIcon },
  { label: 'Debts', value: APP_ROUTES.DEBTS, icon: ErrorIcon },
] as const;

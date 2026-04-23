import { TransactionStatus } from '../../../shared/types';
import { TransactionInvolvement } from '../types';
import {
  parseTransactionSearchQuery,
  serializeTransactionSearchQuery,
} from './transactionSearchUrl';

test('parses status and freeText from URL params', () => {
  const params = new URLSearchParams('freeText=dinner&status=Completed&status=Pending');

  const result = parseTransactionSearchQuery(params);

  expect(result.freeText).toBe('dinner');
  expect(result.status).toEqual([TransactionStatus.Completed, TransactionStatus.Pending]);
});

test('parses involvement, payer, payee, involved, and managedBy', () => {
  const params = new URLSearchParams(
    'involvement=Owned&payer=p1&payee=p2&involved=p3&involved=p4&managedBy=p5',
  );

  const result = parseTransactionSearchQuery(params);

  expect(result.involvement).toBe(TransactionInvolvement.Owned);
  expect(result.payer).toBe('p1');
  expect(result.payee).toBe('p2');
  expect(result.involved).toEqual(['p3', 'p4']);
  expect(result.managedBy).toEqual(['p5']);
});

test('returns empty query for empty params', () => {
  expect(parseTransactionSearchQuery(new URLSearchParams(''))).toEqual({});
});

test('serializes a full query back to URL params', () => {
  const query = {
    freeText: 'dinner',
    status: [TransactionStatus.Completed],
    involvement: TransactionInvolvement.Owned,
    payer: 'p1',
    payee: 'p2',
    involved: ['p3'],
    managedBy: ['p4'],
    category: 'food',
    description: 'test',
  };

  const params = serializeTransactionSearchQuery(query);

  expect(params.get('freeText')).toBe('dinner');
  expect(params.getAll('status')).toEqual(['Completed']);
  expect(params.get('involvement')).toBe('Owned');
  expect(params.get('payer')).toBe('p1');
  expect(params.get('payee')).toBe('p2');
  expect(params.getAll('involved')).toEqual(['p3']);
  expect(params.getAll('managedBy')).toEqual(['p4']);
  expect(params.get('category')).toBe('food');
  expect(params.get('description')).toBe('test');
});

test('serializes empty query to empty string', () => {
  expect(serializeTransactionSearchQuery({}).toString()).toBe('');
});

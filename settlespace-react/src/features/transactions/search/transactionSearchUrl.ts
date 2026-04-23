import {
  parseTransactionInvolvement,
  parseTransactionStatus,
  TransactionSearchQuery,
} from '../types';

export function parseTransactionSearchQuery(params: URLSearchParams): TransactionSearchQuery {
  const query: TransactionSearchQuery = {};

  const freeText = params.get('freeText')?.trim();
  if (freeText) {
    query.freeText = freeText;
  }

  const statuses = params.getAll('status')
    .map((status) => parseTransactionStatus(status))
    .filter((status): status is NonNullable<typeof status> => status !== null);
  if (statuses.length > 0) {
    query.status = statuses;
  }

  const involvement = parseTransactionInvolvement(params.get('involvement'));
  if (involvement) {
    query.involvement = involvement;
  }

  const category = params.get('category');
  if (category) {
    query.category = category;
  }

  const description = params.get('description');
  if (description) {
    query.description = description;
  }

  const involved = params.getAll('involved');
  if (involved.length > 0) {
    query.involved = involved;
  }

  const managedBy = params.getAll('managedBy');
  if (managedBy.length > 0) {
    query.managedBy = managedBy;
  }

  const payer = params.get('payer');
  if (payer) {
    query.payer = payer;
  }

  const payee = params.get('payee');
  if (payee) {
    query.payee = payee;
  }

  return query;
}

export function serializeTransactionSearchQuery(query: TransactionSearchQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.freeText) {
    params.set('freeText', query.freeText);
  }

  if (query.status) {
    for (const status of query.status) {
      params.append('status', status);
    }
  }

  if (query.involvement) {
    params.set('involvement', query.involvement);
  }

  if (query.category) {
    params.set('category', query.category);
  }

  if (query.description) {
    params.set('description', query.description);
  }

  if (query.involved) {
    for (const personId of query.involved) {
      params.append('involved', personId);
    }
  }

  if (query.managedBy) {
    for (const personId of query.managedBy) {
      params.append('managedBy', personId);
    }
  }

  if (query.payer) {
    params.set('payer', query.payer);
  }

  if (query.payee) {
    params.set('payee', query.payee);
  }

  return params;
}

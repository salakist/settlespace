import React, { useMemo, useState } from 'react';
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { canCreateTransaction } from '../../../shared/auth/permissions';
import DateInputField from '../../../shared/components/DateInputField';
import { panelSurfaceSx } from '../../../shared/theme/surfaceStyles';
import {
  getEnumValues,
  Person,
  PersonRole,
  Transaction,
  TransactionStatus,
} from '../../../shared/types';
import { parseTransactionStatus } from '../types';
import {
  DEFAULT_TRANSACTION_CURRENCY,
  DEFAULT_TRANSACTION_STATUS,
} from '../constants';

type TransactionFormProps = {
  transaction?: Transaction;
  persons: Person[];
  currentPersonId?: string;
  role: PersonRole | null;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) => void;
  onCancel: () => void;
};

function formatDateForInput(value?: string): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  persons,
  currentPersonId,
  role,
  onSave,
  onCancel,
}) => {
  const [payerPersonId, setPayerPersonId] = useState(transaction?.payerPersonId ?? currentPersonId ?? '');
  const [payeePersonId, setPayeePersonId] = useState(transaction?.payeePersonId ?? '');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [currencyCode, setCurrencyCode] = useState(transaction?.currencyCode ?? DEFAULT_TRANSACTION_CURRENCY);
  const [transactionDateUtc, setTransactionDateUtc] = useState(formatDateForInput(transaction?.transactionDateUtc));
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status ?? DEFAULT_TRANSACTION_STATUS);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectablePersons = useMemo(() => persons.filter((person) => person.id), [persons]);
  const canCreateWithParticipants = canCreateTransaction(role, currentPersonId, payerPersonId, payeePersonId);
  const canSubmit = transaction ? true : canCreateWithParticipants;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (!payerPersonId || !payeePersonId || !amount || !currencyCode || !transactionDateUtc || !description.trim()) {
      setValidationError('All required fields must be filled.');
      return;
    }

    if (payerPersonId === payeePersonId) {
      setValidationError('Payer and payee must be different persons.');
      return;
    }

    if (!transaction && !canCreateWithParticipants) {
      setValidationError('You must be either the payer or the payee for this transaction.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Amount must be greater than zero.');
      return;
    }

    const normalizedCurrency = currencyCode.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setValidationError('Currency code must be a 3-letter uppercase value.');
      return;
    }

    onSave({
      payerPersonId,
      payeePersonId,
      amount: parsedAmount,
      currencyCode: normalizedCurrency,
      transactionDateUtc: new Date(transactionDateUtc).toISOString(),
      description: description.trim(),
      category: category.trim() || undefined,
      status,
    });
  };

  return (
    <Paper sx={{ ...panelSurfaceSx, mb: 3 }} elevation={0}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'flex-start' }}
            spacing={1.5}
          >
            <Typography variant="h6">
              {transaction ? 'Edit Transaction' : 'Create Transaction'}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="submit" variant="contained" disabled={!canSubmit}>
                {transaction ? 'Update' : 'Create'}
              </Button>
              <Button variant="outlined" onClick={onCancel}>Cancel</Button>
            </Stack>
          </Stack>
          {validationError && <Alert severity="error">{validationError}</Alert>}
          <TextField
            select
            label="Payer"
            value={payerPersonId}
            onChange={(event) => setPayerPersonId(event.target.value)}
            fullWidth
            required
          >
            {selectablePersons.map((person) => (
              <MenuItem key={person.id} value={person.id}>
                {person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Payee"
            value={payeePersonId}
            onChange={(event) => setPayeePersonId(event.target.value)}
            fullWidth
            required
          >
            {selectablePersons.map((person) => (
              <MenuItem key={person.id} value={person.id}>
                {person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            required
          />

          <TextField
            label="Currency"
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())}
            slotProps={{ htmlInput: { maxLength: 3 } }}
            fullWidth
            required
          />

          <DateInputField
            label="Transaction Date"
            value={transactionDateUtc}
            onChange={(event) => setTransactionDateUtc(event.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            fullWidth
            required
          />

          <TextField
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 80 } }}
            fullWidth
          />

          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(parseTransactionStatus(event.target.value) ?? DEFAULT_TRANSACTION_STATUS)}
            fullWidth
            required
          >
            {getEnumValues(TransactionStatus).map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>

          {!transaction && !canCreateWithParticipants && (
            <Alert severity="warning">
              You must be either the payer or the payee for this transaction.
            </Alert>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default TransactionForm;

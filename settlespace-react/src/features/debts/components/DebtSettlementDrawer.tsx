import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DebtDetails, DebtSummary, Person, SettleDebtRequest } from '../../../shared/types';

type DebtSettlementDrawerProps = {
  open: boolean;
  debt?: DebtSummary;
  details?: DebtDetails;
  persons: Person[];
  loading: boolean;
  saving: boolean;
  error?: string | null;
  successMessage?: string | null;
  onClose: () => void;
  onSubmit: (request: SettleDebtRequest) => Promise<void>;
};

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function clampAmount(value: number, maxAmount: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), maxAmount);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function getPersonDisplayName(persons: Person[], personId: string): string {
  const person = persons.find((candidate) => candidate.id === personId);
  return person ? `${person.firstName} ${person.lastName}` : personId;
}

function getDirectionTitle(direction?: DebtSummary['direction']): string {
  switch (direction) {
    case 'TheyOweYou':
      return 'They owe you';
    case 'YouOweThem':
      return 'You owe them';
    default:
      return 'Settled';
  }
}

function getPrimaryMessage(
  direction: DebtSummary['direction'] | undefined,
  amountText: string,
  percentage: number,
  totalText: string,
): string {
  if (direction === 'TheyOweYou') {
    return `You are recording ${amountText} received (${percentage}% of ${totalText}).`;
  }

  if (direction === 'Settled') {
    return 'This balance is already settled.';
  }

  return `You are paying ${amountText} (${percentage}% of ${totalText}).`;
}

function getDescriptionPlaceholder(direction?: DebtSummary['direction']): string {
  return direction === 'TheyOweYou' ? 'Settlement received' : 'Debt repayment';
}

function getSubmitLabel(direction: DebtSummary['direction'] | undefined, saving: boolean): string {
  if (saving) {
    return 'Saving...';
  }

  return direction === 'TheyOweYou' ? 'Record received payment' : 'Record payment';
}

function getAlertSeverity(direction?: DebtSummary['direction']): 'success' | 'info' {
  return direction === 'TheyOweYou' ? 'success' : 'info';
}

const SURFACE_BACKGROUND = 'rgba(255,255,255,0.04)';
const SLIDER_MARKS = [0, 25, 50, 75, 100].map((value) => ({ value, label: `${value}%` }));

const DebtSettlementDrawer: React.FC<DebtSettlementDrawerProps> = ({
  open,
  debt,
  details,
  persons,
  loading,
  saving,
  error,
  successMessage,
  onClose,
  onSubmit,
}) => {
  const maxAmount = roundCurrency(Math.max(debt?.netAmount ?? 0, 0));
  const currencyCode = debt?.currencyCode ?? 'EUR';
  const counterpartyName = debt ? getPersonDisplayName(persons, debt.counterpartyPersonId) : 'Counterparty';
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    setAmount(maxAmount);
    setDescription('');
  }, [maxAmount, debt?.counterpartyPersonId, debt?.currencyCode, open]);

  const percentage = useMemo(() => {
    if (maxAmount <= 0) {
      return 0;
    }

    return Math.round((amount / maxAmount) * 100);
  }, [amount, maxAmount]);

  const remainingAmount = roundCurrency(Math.max(maxAmount - amount, 0));
  const amountText = formatCurrency(amount, currencyCode);
  const totalText = formatCurrency(maxAmount, currencyCode);
  const remainingText = formatCurrency(remainingAmount, currencyCode);
  const primaryMessage = getPrimaryMessage(debt?.direction, amountText, percentage, totalText);

  const handleSliderChange = (_event: Event, nextValue: number | number[]) => {
    const candidate = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    const normalizedPercentage = Math.min(Math.max(Number(candidate), 0), 100);
    setAmount(roundCurrency((normalizedPercentage / 100) * maxAmount));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(roundCurrency(clampAmount(Number(event.target.value), maxAmount)));
  };

  const handlePercentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedPercentage = Math.min(Math.max(Number(event.target.value), 0), 100);
    setAmount(roundCurrency((normalizedPercentage / 100) * maxAmount));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!debt || amount <= 0) {
      return;
    }

    await onSubmit({
      counterpartyPersonId: debt.counterpartyPersonId,
      amount,
      currencyCode: debt.currencyCode,
      description: description.trim() || undefined,
    });
  };

  let drawerContent: React.ReactNode;

  if (loading) {
    drawerContent = (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  } else if (debt) {
    drawerContent = (
      <>
        <Paper elevation={0} sx={{ p: 2, backgroundColor: SURFACE_BACKGROUND }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1">
              {getDirectionTitle(debt.direction)}
            </Typography>
            <Typography variant="h6">{totalText}</Typography>
            <Typography variant="body2" color="text.secondary">
              Based on {details?.transactionCount ?? debt.transactionCount} completed transactions in {currencyCode}.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                <strong>Paid by you:</strong> {formatCurrency(details?.paidByCurrentPerson ?? 0, currencyCode)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Paid by {counterpartyName}:</strong> {formatCurrency(details?.paidByCounterparty ?? 0, currencyCode)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Alert severity={getAlertSeverity(debt.direction)}>
          {primaryMessage} Remaining balance after this action: {remainingText}
        </Alert>

        <div>
          <Typography gutterBottom>Settlement amount</Typography>
          <Slider
            value={percentage}
            min={0}
            max={100}
            step={1}
            marks={SLIDER_MARKS}
            onChange={handleSliderChange}
            aria-label="Settlement amount percentage"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            disabled={saving || maxAmount <= 0}
          />
        </div>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label={`Amount (${currencyCode})`}
            type="number"
            value={amount}
            onChange={handleAmountChange}
            inputProps={{ min: 0, max: maxAmount, step: 0.01 }}
            disabled={saving || maxAmount <= 0}
            fullWidth
          />

          <TextField
            label="Percent (%)"
            type="number"
            value={percentage}
            onChange={handlePercentChange}
            inputProps={{ min: 0, max: 100, step: 1 }}
            disabled={saving || maxAmount <= 0}
            fullWidth
          />
        </Stack>

        <TextField
          label="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={getDescriptionPlaceholder(debt.direction)}
          disabled={saving}
          fullWidth
        />

        <Divider />

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose} disabled={saving}>Close</Button>
          <Button type="submit" variant="contained" disabled={saving || amount <= 0 || maxAmount <= 0}>
            {getSubmitLabel(debt.direction, saving)}
          </Button>
        </Stack>
      </>
    );
  } else {
    drawerContent = <Typography color="text.secondary">Select a debt to settle.</Typography>;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          p: 3,
          backgroundImage: 'none',
        },
      }}
    >
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
        <div>
          <Typography variant="overline" color="primary.main">
            Settlement
          </Typography>
          <Typography variant="h5">{counterpartyName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust this balance with a partial or full settlement entry.
          </Typography>
        </div>

        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        {drawerContent}
      </Stack>
    </Drawer>
  );
};

export default DebtSettlementDrawer;

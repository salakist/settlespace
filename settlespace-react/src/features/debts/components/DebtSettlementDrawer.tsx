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
import { DebtDetails, DebtDirection, DebtSummary, SettleDebtRequest } from '../types';
import { insetSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { DEFAULT_TRANSACTION_CURRENCY } from '../../transactions/constants';
import {
  DEBT_DIRECTION_LABELS,
  DEBT_SETTLEMENT_SLIDER_MARKS,
  DEBT_SETTLEMENT_TEXT,
} from '../constants';

type DebtSettlementDrawerProps = {
  open: boolean;
  debt?: DebtSummary;
  details?: DebtDetails;
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

function getDirectionTitle(direction?: DebtSummary['direction']): string {
  return direction
    ? DEBT_DIRECTION_LABELS[direction]
    : DEBT_DIRECTION_LABELS[DebtDirection.Settled];
}

function getPrimaryMessage(
  direction: DebtSummary['direction'] | undefined,
  amountText: string,
  percentage: number,
  totalText: string,
): string {
  if (direction === DebtDirection.TheyOweYou) {
    return `You are recording ${amountText} received (${percentage}% of ${totalText}).`;
  }

  if (direction === DebtDirection.Settled) {
    return DEBT_SETTLEMENT_TEXT.ALREADY_SETTLED;
  }

  return `You are paying ${amountText} (${percentage}% of ${totalText}).`;
}

function getDescriptionPlaceholder(direction?: DebtSummary['direction']): string {
  return direction === DebtDirection.TheyOweYou
    ? DEBT_SETTLEMENT_TEXT.SETTLEMENT_RECEIVED_PLACEHOLDER
    : DEBT_SETTLEMENT_TEXT.DEBT_REPAYMENT_PLACEHOLDER;
}

function getSubmitLabel(direction: DebtSummary['direction'] | undefined, saving: boolean): string {
  if (saving) {
    return DEBT_SETTLEMENT_TEXT.SAVING;
  }

  return direction === DebtDirection.TheyOweYou
    ? DEBT_SETTLEMENT_TEXT.RECORD_RECEIVED_PAYMENT
    : DEBT_SETTLEMENT_TEXT.RECORD_PAYMENT;
}

function getAlertSeverity(direction?: DebtSummary['direction']): 'success' | 'info' {
  return direction === DebtDirection.TheyOweYou ? 'success' : 'info';
}

const SLIDER_MARKS = DEBT_SETTLEMENT_SLIDER_MARKS;

const DebtSettlementDrawer: React.FC<DebtSettlementDrawerProps> = ({
  open,
  debt,
  details,
  loading,
  saving,
  error,
  successMessage,
  onClose,
  onSubmit,
}) => {
  const maxAmount = roundCurrency(Math.max(debt?.netAmount ?? 0, 0));
  const currencyCode = debt?.currencyCode ?? DEFAULT_TRANSACTION_CURRENCY;
  const counterpartyName = debt
    ? (debt.counterpartyDisplayName ?? debt.counterpartyPersonId)
    : DEBT_SETTLEMENT_TEXT.COUNTERPARTY_FALLBACK;
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

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
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
        <Paper elevation={0} sx={insetSurfaceSx}>
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
          <Typography gutterBottom>{DEBT_SETTLEMENT_TEXT.SETTLEMENT_AMOUNT}</Typography>
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
            slotProps={{ htmlInput: { min: 0, max: maxAmount, step: 0.01 } }}
            disabled={saving || maxAmount <= 0}
            fullWidth
          />

          <TextField
            label={DEBT_SETTLEMENT_TEXT.PERCENT_LABEL}
            type="number"
            value={percentage}
            onChange={handlePercentChange}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
            disabled={saving || maxAmount <= 0}
            fullWidth
          />
        </Stack>

        <TextField
          label={DEBT_SETTLEMENT_TEXT.DESCRIPTION_LABEL}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={getDescriptionPlaceholder(debt.direction)}
          disabled={saving}
          fullWidth
        />

        <Divider />

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button type="submit" variant="contained" disabled={saving || amount <= 0 || maxAmount <= 0}>
            {getSubmitLabel(debt.direction, saving)}
          </Button>
          <Button onClick={onClose} disabled={saving}>{DEBT_SETTLEMENT_TEXT.CLOSE}</Button>
        </Stack>
      </>
    );
  } else {
    drawerContent = <Typography color="text.secondary">{DEBT_SETTLEMENT_TEXT.SELECT_DEBT_PROMPT}</Typography>;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 440 },
            p: 3,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
        <div>
          <Typography variant="overline" color="primary.main">
            {DEBT_SETTLEMENT_TEXT.SETTLEMENT}
          </Typography>
          <Typography variant="h5">{counterpartyName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {DEBT_SETTLEMENT_TEXT.BALANCE_HELPER}
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

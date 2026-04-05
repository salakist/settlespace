import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/constants';
import { DebtDetails, DebtDirection, DebtSummary, Transaction } from '../../../shared/types';
import { panelSurfaceSx, listItemSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateFormatting';
import { DEBT_DIRECTION_LABELS, DEBT_LIST_TEXT } from '../constants';
import { useDebts } from '../hooks/useDebts';
import DebtSettlementDrawer from './DebtSettlementDrawer';

type DebtDetailsPageProps = {
  expireSession: (message?: string) => void;
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

function getDirectionSummary(direction: DebtSummary['direction']): string {
  return DEBT_DIRECTION_LABELS[direction];
}

function getTransactionNarrative(transaction: Transaction): string {
  const payerName = transaction.payerDisplayName ?? transaction.payerPersonId;
  const payeeName = transaction.payeeDisplayName ?? transaction.payeePersonId;
  return `${payerName} paid ${payeeName}`;
}

function toDebtSummary(detail: DebtDetails): DebtSummary {
  return {
    counterpartyPersonId: detail.counterpartyPersonId,
    counterpartyDisplayName: detail.counterpartyDisplayName,
    currencyCode: detail.currencyCode,
    netAmount: detail.netAmount,
    direction: detail.direction,
    transactionCount: detail.transactionCount,
  };
}

const DebtDetailsPage: React.FC<DebtDetailsPageProps> = ({ expireSession }) => {
  const navigate = useNavigate();
  const { counterpartyPersonId, currencyCode } = useParams();
  const decodedCurrencyCode = currencyCode ? decodeURIComponent(currencyCode) : undefined;
  const [detail, setDetail] = useState<DebtDetails | undefined>();
  const [pageLoading, setPageLoading] = useState(true);

  const {
    clearSuccessMessage,
    closeSettlementDrawer,
    detailsLoading,
    error,
    loadDebtDetails,
    openSettlementDrawer,
    selectedDebt,
    selectedDebtDetail,
    settlementOpen,
    settlementSaving,
    submitSettlement,
    successMessage,
  } = useDebts({ expireSession });

  const loadPageDetails = useCallback(async () => {
    if (!counterpartyPersonId || !decodedCurrencyCode) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    const nextDetail = await loadDebtDetails(counterpartyPersonId, decodedCurrencyCode);
    setDetail(nextDetail);
    setPageLoading(false);
  }, [counterpartyPersonId, decodedCurrencyCode, loadDebtDetails]);

  useEffect(() => {
    Promise.resolve(loadPageDetails()).catch((loadError) => {
      console.error(loadError);
    });
  }, [loadPageDetails]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    Promise.resolve(loadPageDetails()).catch((loadError) => {
      console.error(loadError);
    });
  }, [loadPageDetails, successMessage]);

  const debtSummary = detail ? toDebtSummary(detail) : undefined;
  const displayedDetail = selectedDebtDetail ?? detail;
  const displayedSummary = selectedDebt ?? debtSummary;
  const transactions = useMemo(() => {
    const source = displayedDetail?.transactions ?? [];
    return [...source].sort((left, right) => (
      Date.parse(right.transactionDateUtc) - Date.parse(left.transactionDateUtc)
    ));
  }, [displayedDetail]);

  if (!counterpartyPersonId || !decodedCurrencyCode) {
    return <Navigate to={APP_ROUTES.DEBTS} replace />;
  }

  let pageContent: React.ReactNode;

  if (pageLoading) {
    pageContent = (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    );
  } else if (detail) {
    pageContent = (
      <>
        <Paper elevation={0} sx={panelSurfaceSx}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
              spacing={1.5}
            >
              <div>
                <Typography variant="overline" color="primary.main">
                  {getDirectionSummary(detail.direction)}
                </Typography>
                <Typography variant="h6">
                  {(detail.counterpartyDisplayName ?? detail.counterpartyPersonId)} · {formatCurrency(detail.netAmount, detail.currencyCode)}
                </Typography>
              </div>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={() => {
                    if (debtSummary) {
                      void openSettlementDrawer(debtSummary);
                    }
                  }}
                  disabled={!debtSummary || debtSummary.direction === DebtDirection.Settled || debtSummary.netAmount <= 0}
                >
                  {DEBT_LIST_TEXT.SETTLE_NOW}
                </Button>
                <Button variant="outlined" onClick={() => navigate(APP_ROUTES.DEBTS)}>
                  Back
                </Button>
              </Stack>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                <strong>Paid by you:</strong> {formatCurrency(detail.paidByCurrentPerson, detail.currencyCode)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Paid by {detail.counterpartyDisplayName ?? detail.counterpartyPersonId}:</strong>{' '}
                {formatCurrency(detail.paidByCounterparty, detail.currencyCode)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Completed transactions:</strong> {detail.transactionCount}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {transactions.length === 0 ? (
          <Alert severity="info">No completed transactions are currently contributing to this balance.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {transactions.map((transaction) => (
              <Paper
                key={transaction.id ?? `${transaction.transactionDateUtc}-${transaction.amount}`}
                elevation={0}
                sx={listItemSurfaceSx}
              >
                <Stack spacing={0.75}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <div>
                      <Typography variant="subtitle1">{transaction.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getTransactionNarrative(transaction)}
                      </Typography>
                    </div>
                    <Typography variant="subtitle2">
                      {formatCurrency(transaction.amount, transaction.currencyCode)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateDDMMYYYY(transaction.transactionDateUtc)}
                    {transaction.category ? ` · ${transaction.category}` : ''}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </>
    );
  } else {
    pageContent = <Alert severity="info">No debt details were found for this counterparty and currency.</Alert>;
  }

  return (
    <Stack spacing={2.5}>
      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {pageContent}

      <DebtSettlementDrawer
        open={settlementOpen}
        debt={displayedSummary}
        details={displayedDetail}
        loading={detailsLoading}
        saving={settlementSaving}
        error={error}
        successMessage={successMessage}
        onClose={closeSettlementDrawer}
        onSubmit={submitSettlement}
      />
    </Stack>
  );
};

export default DebtDetailsPage;

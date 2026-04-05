import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Alert, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { DebtDirection, DebtSummary } from '../../../shared/types';
import { panelSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { DEBT_DIRECTION_LABELS, DEBT_LIST_TEXT } from '../constants';

type DebtsListProps = {
  debts: DebtSummary[];
  onSettle: (debt: DebtSummary) => void;
  onViewDetails: (debt: DebtSummary) => void;
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

function getDirectionLabel(direction: DebtSummary['direction']): string {
  return DEBT_DIRECTION_LABELS[direction];
}

function getDirectionColor(direction: DebtSummary['direction']): 'success' | 'warning' | 'default' {
  switch (direction) {
    case DebtDirection.TheyOweYou:
      return 'success';
    case DebtDirection.YouOweThem:
      return 'warning';
    default:
      return 'default';
  }
}

function getTransactionCountLabel(count: number): string {
  return count === 1 ? '1 transaction' : `${count} transactions`;
}

function getSettlementButtonLabel(direction: DebtSummary['direction']): string {
  if (direction === DebtDirection.Settled) {
    return DEBT_LIST_TEXT.SETTLED;
  }

  return DEBT_LIST_TEXT.SETTLE_NOW;
}

const DebtsList: React.FC<DebtsListProps> = ({ debts, onSettle, onViewDetails }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeDebt, setActiveDebt] = useState<DebtSummary | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, debt: DebtSummary) => {
    setMenuAnchor(event.currentTarget);
    setActiveDebt(debt);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveDebt(null);
  };

  const handleViewDetailsAction = () => {
    if (activeDebt) {
      onViewDetails(activeDebt);
    }

    handleCloseMenu();
  };

  const handleSettleAction = () => {
    if (activeDebt && activeDebt.direction !== DebtDirection.Settled && activeDebt.netAmount > 0) {
      onSettle(activeDebt);
    }

    handleCloseMenu();
  };

  if (debts.length === 0) {
    return (
      <Alert severity="info">{DEBT_LIST_TEXT.EMPTY_STATE}</Alert>
    );
  }

  const sortedDebts = [...debts].sort((left, right) => right.netAmount - left.netAmount);

  return (
    <>
      <Stack spacing={2}>
        {sortedDebts.map((debt) => {
        const counterpartyName = debt.counterpartyDisplayName ?? debt.counterpartyPersonId;
        const balanceText = formatCurrency(debt.netAmount, debt.currencyCode);
        const transactionCountLabel = getTransactionCountLabel(debt.transactionCount);

        return (
          <Paper
            key={`${debt.counterpartyPersonId}-${debt.currencyCode}`}
            elevation={0}
            sx={panelSurfaceSx}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.25}
              useFlexGap
            >
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography variant="h6">{counterpartyName}</Typography>
                  <Chip
                    label={getDirectionLabel(debt.direction)}
                    color={getDirectionColor(debt.direction)}
                    variant={debt.direction === DebtDirection.Settled ? 'outlined' : 'filled'}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {balanceText} • {debt.currencyCode} • {transactionCountLabel}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
                <IconButton
                  aria-label={`Open actions for ${counterpartyName}`}
                  onClick={(event) => handleOpenMenu(event, debt)}
                  sx={{ ml: { md: 'auto' } }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        );
        })}
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleViewDetailsAction}>{DEBT_LIST_TEXT.DETAILS}</MenuItem>
        <MenuItem
          onClick={handleSettleAction}
          disabled={!activeDebt || activeDebt.direction === DebtDirection.Settled || activeDebt.netAmount <= 0}
        >
          {activeDebt ? getSettlementButtonLabel(activeDebt.direction) : 'Settle now'}
        </MenuItem>
      </Menu>
    </>
  );
};

export default DebtsList;

import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Alert, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { Transaction, TransactionStatus } from '../../../shared/types';
import { listItemSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateFormatting';

type TransactionListProps = {
  transactions: Transaction[];
  currentPersonId?: string;
  canManage: (transaction: Transaction) => boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
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

function getStatusColor(status: TransactionStatus): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Cancelled':
      return 'error';
    default:
      return 'default';
  }
}

const SECONDARY_TEXT_COLOR = 'text.secondary';
const FLEX_START = 'flex-start';

function isManagedTransaction(transaction: Transaction, currentPersonId?: string): boolean {
  if (!currentPersonId || transaction.createdByPersonId !== currentPersonId) {
    return false;
  }

  return transaction.payerPersonId !== currentPersonId && transaction.payeePersonId !== currentPersonId;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currentPersonId,
  canManage,
  onEdit,
  onDelete,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, transaction: Transaction) => {
    setMenuAnchor(event.currentTarget);
    setActiveTransaction(transaction);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveTransaction(null);
  };

  const handleEditAction = () => {
    if (activeTransaction) {
      onEdit(activeTransaction);
    }

    handleCloseMenu();
  };

  const handleDeleteAction = () => {
    if (activeTransaction?.id) {
      onDelete(activeTransaction.id);
    }

    handleCloseMenu();
  };
  if (transactions.length === 0) {
    return <Alert severity="info">No transactions found for your account.</Alert>;
  }

  return (
    <>
      <Stack spacing={1.5}>
        {transactions.map((transaction) => {
          const transactionId = transaction.id;

          return (
            <Paper key={transactionId} elevation={0} sx={listItemSurfaceSx}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: FLEX_START, md: 'center' }}
                spacing={1.25}
                useFlexGap
              >
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography variant="subtitle1">{transaction.description}</Typography>
                    <Chip label={transaction.status} size="small" color={getStatusColor(transaction.status)} />
                    {isManagedTransaction(transaction, currentPersonId) && (
                      <Chip label="Managed" size="small" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="body2" color={SECONDARY_TEXT_COLOR}>
                    {(transaction.payerDisplayName ?? transaction.payerPersonId)} paid {(transaction.payeeDisplayName ?? transaction.payeePersonId)}
                  </Typography>
                  <Typography variant="caption" color={SECONDARY_TEXT_COLOR}>
                    {formatDateDDMMYYYY(transaction.transactionDateUtc)}
                    {transaction.category ? ` • ${transaction.category}` : ''}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, ml: 'auto', lineHeight: 1.1, whiteSpace: 'nowrap' }}
                  >
                    {formatCurrency(transaction.amount, transaction.currencyCode)}
                  </Typography>
                  <IconButton
                    aria-label={`Open actions for ${transaction.description}`}
                    onClick={(event) => handleOpenMenu(event, transaction)}
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
        <MenuItem onClick={handleEditAction} disabled={!activeTransaction || !canManage(activeTransaction)}>
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleDeleteAction}
          disabled={!activeTransaction?.id || !activeTransaction || !canManage(activeTransaction)}
        >
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default TransactionList;

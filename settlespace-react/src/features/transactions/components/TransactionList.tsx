import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { Transaction, TransactionStatus } from '../../../shared/types';
import { listItemSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateFormatting';
import SearchResultsAlert from '../../search/components/SearchResultsAlert';
import { TRANSACTION_LIST_STYLE, TRANSACTION_LIST_TEXT } from '../constants';

type TransactionListProps = {
  transactions: Transaction[];
  currentPersonId?: string;
  canUpdate: (transaction: Transaction) => boolean;
  canDelete: (transaction: Transaction) => boolean;
  canConfirm: (transaction: Transaction) => boolean;
  canRefuse: (transaction: Transaction) => boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onRefuse: (id: string) => void;
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
    case TransactionStatus.Completed:
      return 'success';
    case TransactionStatus.Pending:
      return 'warning';
    case TransactionStatus.Cancelled:
      return 'error';
    default:
      return 'default';
  }
}

const { SECONDARY_TEXT_COLOR, FLEX_START } = TRANSACTION_LIST_STYLE;

function isManagedTransaction(transaction: Transaction, currentPersonId?: string): boolean {
  if (!currentPersonId || transaction.createdByPersonId !== currentPersonId) {
    return false;
  }

  return transaction.payerPersonId !== currentPersonId && transaction.payeePersonId !== currentPersonId;
}

function getManagedByLabel(transaction: Transaction, currentPersonId?: string): string | null {
  const creatorPersonId = transaction.createdByPersonId;

  if (!creatorPersonId || creatorPersonId === currentPersonId) {
    return null;
  }

  if (creatorPersonId === transaction.payerPersonId || creatorPersonId === transaction.payeePersonId) {
    return null;
  }

  return `${TRANSACTION_LIST_TEXT.MANAGED_BY} ${transaction.createdByDisplayName ?? creatorPersonId}`;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currentPersonId,
  canUpdate,
  canDelete,
  canConfirm,
  canRefuse,
  onEdit,
  onDelete,
  onConfirm,
  onRefuse,
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

  const handleConfirmAction = () => {
    if (activeTransaction?.id) {
      onConfirm(activeTransaction.id);
    }

    handleCloseMenu();
  };

  const handleRefuseAction = () => {
    if (activeTransaction?.id) {
      onRefuse(activeTransaction.id);
    }

    handleCloseMenu();
  };
  if (transactions.length === 0) {
    return <SearchResultsAlert entityName="transactions" />;
  }

  return (
    <>
      <Stack spacing={1.5}>
        {transactions.map((transaction) => {
          const transactionId = transaction.id;
          const managedByLabel = getManagedByLabel(transaction, currentPersonId);
          const hasAnyAction =
            canUpdate(transaction) ||
            canDelete(transaction) ||
            canConfirm(transaction) ||
            canRefuse(transaction);

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
                      <Chip label={TRANSACTION_LIST_TEXT.MANAGED} size="small" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="body2" color={SECONDARY_TEXT_COLOR}>
                    {(transaction.payerDisplayName ?? transaction.payerPersonId)} paid {(transaction.payeeDisplayName ?? transaction.payeePersonId)}
                  </Typography>
                  {managedByLabel && (
                    <Typography variant="caption" color={SECONDARY_TEXT_COLOR}>
                      {managedByLabel}
                    </Typography>
                  )}
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
                  {hasAnyAction ? (
                    <IconButton
                      aria-label={`Open actions for ${transaction.description}`}
                      onClick={(event) => handleOpenMenu(event, transaction)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  ) : (
                    <Box sx={{ width: 40, flexShrink: 0 }} />
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        {activeTransaction && canUpdate(activeTransaction) && (
          <MenuItem onClick={handleEditAction}>
            {TRANSACTION_LIST_TEXT.EDIT}
          </MenuItem>
        )}
        {activeTransaction && canDelete(activeTransaction) && (
          <MenuItem onClick={handleDeleteAction}>
            {TRANSACTION_LIST_TEXT.DELETE}
          </MenuItem>
        )}
        {activeTransaction && canConfirm(activeTransaction) && (
          <MenuItem onClick={handleConfirmAction}>
            {TRANSACTION_LIST_TEXT.CONFIRM}
          </MenuItem>
        )}
        {activeTransaction && canRefuse(activeTransaction) && (
          <MenuItem onClick={handleRefuseAction}>
            {TRANSACTION_LIST_TEXT.REFUSE}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default TransactionList;

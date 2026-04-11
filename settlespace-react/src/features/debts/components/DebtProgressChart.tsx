import React, { useMemo } from 'react';
import { Box, Paper, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChartsReferenceLine, LineChart } from '@mui/x-charts';
import { Transaction } from '../../../shared/types';
import { panelSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateFormatting';
import { buildDebtProgressData, formatDebtProgressTickLabel } from './debtProgressData';

type DebtProgressChartProps = {
  transactions: Transaction[];
  counterpartyPersonId: string;
  currencyCode: string;
};

function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: { trimWholeNumbers?: boolean },
): string {
  const shouldTrimWholeNumbers = options?.trimWholeNumbers === true;
  const isWholeNumber = Math.abs(amount - Math.round(amount)) < 0.000_001;
  const minimumFractionDigits = shouldTrimWholeNumbers && isWholeNumber ? 0 : 2;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(minimumFractionDigits)}`;
  }
}

function formatSignedCurrency(amount: number, currencyCode: string): string {
  const formatted = formatCurrency(Math.abs(amount), currencyCode);

  if (amount > 0) {
    return `+${formatted}`;
  }

  if (amount < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

const DebtProgressChart: React.FC<DebtProgressChartProps> = ({
  transactions,
  counterpartyPersonId,
  currencyCode,
}) => {
  const theme = useTheme();
  const points = useMemo(
    () => buildDebtProgressData(transactions, counterpartyPersonId),
    [counterpartyPersonId, transactions],
  );
  const chartPoints = useMemo(() => {
    if (points.length <= 1) {
      return points;
    }

    return points.reduce<typeof points>((accumulator, point, index) => {
      if (index === 0) {
        accumulator.push(point);
        return accumulator;
      }

      const previousPoint = points[index - 1];
      const crossedZero = previousPoint.balance !== 0
        && point.balance !== 0
        && Math.sign(previousPoint.balance) !== Math.sign(point.balance);

      if (crossedZero) {
        const balanceDelta = point.balance - previousPoint.balance;
        const zeroRatio = balanceDelta === 0
          ? 0.5
          : Math.abs(previousPoint.balance / balanceDelta);
        const crossingTimestamp = new Date(
          previousPoint.timestamp.getTime()
            + ((point.timestamp.getTime() - previousPoint.timestamp.getTime()) * zeroRatio),
        );

        accumulator.push({
          balance: 0,
          delta: 0,
          description: 'Settled crossing',
          label: formatDateDDMMYYYY(crossingTimestamp.toISOString()) || 'Settled crossing',
          pointType: 'transaction',
          timestamp: crossingTimestamp,
        });
      }

      accumulator.push(point);
      return accumulator;
    }, []);
  }, [points]);

  const balances = chartPoints.map((point) => point.balance);
  const negativeBalances = chartPoints.map((point, index) => {
    if (point.balance < 0) {
      return point.balance;
    }

    if (point.balance !== 0) {
      return null;
    }

    const previousBalance = chartPoints[index - 1]?.balance ?? 0;
    const nextBalance = chartPoints[index + 1]?.balance ?? 0;
    const touchesNegativeSegment = previousBalance < 0 || nextBalance < 0;

    return touchesNegativeSegment ? 0 : null;
  });
  const minBalance = Math.min(0, ...balances);
  const maxBalance = Math.max(0, ...balances);
  const axisPadding = Math.max((maxBalance - minBalance) * 0.08, 12);
  const displayMinBalance = minBalance - axisPadding;
  const displayMaxBalance = maxBalance + (axisPadding * 0.35);
  const firstPointTimestamp = chartPoints[0]?.timestamp.getTime() ?? 0;
  const firstTransactionTimestamp = chartPoints[1]?.timestamp ?? chartPoints[0]?.timestamp ?? new Date();
  const lastPointTimestamp = chartPoints[chartPoints.length - 1]?.timestamp ?? new Date();
  const chartHeight = 328;
  const chartMargin = { bottom: 36, left: 8, right: 20, top: 12 };

  const formatPointValue = (value: number | null, dataIndex?: number): string => {
    if (value == null) {
      return '';
    }

    const point = typeof dataIndex === 'number' ? chartPoints[dataIndex] : undefined;

    if (!point) {
      return formatCurrency(value, currencyCode);
    }

    if (point.pointType === 'start') {
      return `${formatCurrency(point.balance, currencyCode)} · ${point.description}`;
    }

    if (point.delta === 0 && point.balance === 0) {
      return `${formatCurrency(0, currencyCode)} · ${point.description}`;
    }

    return [
      `${formatCurrency(point.balance, currencyCode)} current balance`,
      `${formatSignedCurrency(point.delta, currencyCode)} change`,
      point.description,
    ].join(' · ');
  };

  if (points.length === 0) {
    return null;
  }

  return (
    <Paper elevation={0} sx={panelSurfaceSx} data-testid="debt-progress-chart">
      <Stack spacing={2} sx={{ width: '100%' }}>
        <div>
          <Typography variant="subtitle1">Debt progression</Typography>
          <Typography variant="body2" color="text.secondary">
            Positive values mean they owe you. Negative values mean you owe them.
          </Typography>
        </div>

        <Box
          sx={{
            left: { md: '-23px', xs: 0 },
            position: 'relative',
            width: '100%',
          }}
        >
          <LineChart
              height={chartHeight}
              xAxis={[
              {
                data: chartPoints.map((point) => point.timestamp),
                domainLimit: 'strict',
                max: lastPointTimestamp,
                min: chartPoints[0].timestamp,
                scaleType: 'time',
                tickNumber: 5,
                valueFormatter: (value: Date, context) => {
                  const parsed = value instanceof Date ? value : new Date(value);

                  if (Number.isNaN(parsed.getTime())) {
                    return '';
                  }

                  if (context.location !== 'tick') {
                    return formatDateDDMMYYYY(parsed.toISOString());
                  }

                  if (parsed.getTime() <= firstPointTimestamp) {
                    return '';
                  }

                  return formatDebtProgressTickLabel(parsed, firstTransactionTimestamp, lastPointTimestamp);
                },
              },
            ]}
            yAxis={[
              {
                max: displayMaxBalance,
                min: displayMinBalance,
                tickNumber: 6,
                width: 96,
                valueFormatter: (value: number) => formatCurrency(value, currencyCode, { trimWholeNumbers: true }),
              },
            ]}
            series={[
              {
                color: theme.palette.primary.light,
                curve: 'linear',
                data: balances,
                label: 'Balance',
                showMark: false,
                valueFormatter: (value, context) => {
                  const point = chartPoints[context.dataIndex];
                  const belongsToNegativeSegment = negativeBalances[context.dataIndex] != null;

                  return point != null && (point.balance < 0 || (point.balance === 0 && belongsToNegativeSegment))
                    ? null as unknown as string
                    : formatPointValue(value, context.dataIndex);
                },
              },
              {
                color: theme.palette.error.main,
                curve: 'linear',
                data: negativeBalances,
                label: 'Balance',
                showMark: false,
                valueFormatter: (value, context) => {
                  const point = chartPoints[context.dataIndex];
                  const belongsToNegativeSegment = negativeBalances[context.dataIndex] != null;

                  return point != null && (point.balance < 0 || (point.balance === 0 && belongsToNegativeSegment))
                    ? formatPointValue(value, context.dataIndex)
                    : null as unknown as string;
                },
              },
            ]}
            grid={{ horizontal: true }}
            hideLegend
            margin={chartMargin}
            skipAnimation
            sx={{
              width: '100%',
              '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
                stroke: alpha(theme.palette.common.white, 0.18),
              },
              '& .MuiChartsAxis-tickLabel': {
                fill: theme.palette.text.secondary,
                fontSize: 12,
              },
              '& .MuiLineElement-root': {
                strokeWidth: 3,
              },
              '& .MuiMarkElement-root': {
                fill: theme.palette.primary.light,
                fillOpacity: 0.85,
                stroke: alpha(theme.palette.background.paper, 0.9),
                strokeWidth: 1.5,
              },
            }}
          >
            <ChartsReferenceLine
              y={0}
              lineStyle={{
                stroke: alpha(theme.palette.text.secondary, 0.7),
                strokeDasharray: '4 4',
              }}
            />
          </LineChart>
        </Box>
      </Stack>
    </Paper>
  );
};

export default DebtProgressChart;

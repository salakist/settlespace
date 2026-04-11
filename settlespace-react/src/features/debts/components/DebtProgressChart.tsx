import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [settledLabelTop, setSettledLabelTop] = useState<number | null>(null);

  const balances = points.map((point) => point.balance);
  const minBalance = Math.min(0, ...balances);
  const maxBalance = Math.max(0, ...balances);
  const firstPointTimestamp = points[0]?.timestamp.getTime() ?? 0;
  const firstTransactionTimestamp = points[1]?.timestamp ?? points[0]?.timestamp ?? new Date();
  const lastPointTimestamp = points[points.length - 1]?.timestamp ?? new Date();
  const chartHeight = 300;
  const chartMargin = { bottom: 36, left: 8, right: 88, top: 16 };
  const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;
  const zeroLineTop = maxBalance === minBalance
    ? chartMargin.top + (plotHeight / 2)
    : chartMargin.top + ((maxBalance / (maxBalance - minBalance)) * plotHeight);

  useLayoutEffect(() => {
    const chartContainer = chartContainerRef.current;

    if (points.length === 0) {
      setSettledLabelTop(null);
      return undefined;
    }

    if (!chartContainer || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const updateSettledLabelTop = () => {
      const svgRoot = chartContainer.querySelector('svg');
      const referenceLine = svgRoot
        ? Array.from(svgRoot.querySelectorAll('path, line')).find((element) => {
            const strokeDasharray = window.getComputedStyle(element).strokeDasharray;
            return strokeDasharray !== 'none' && strokeDasharray !== '';
          }) as SVGGraphicsElement | undefined
        : undefined;

      if (!referenceLine) {
        setSettledLabelTop(null);
        return;
      }

      const containerRect = chartContainer.getBoundingClientRect();
      const lineRect = referenceLine.getBoundingClientRect();
      setSettledLabelTop(lineRect.top - containerRect.top);
    };

    const frameId = window.requestAnimationFrame(updateSettledLabelTop);
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateSettledLabelTop);
    });

    resizeObserver.observe(chartContainer);
    window.addEventListener('resize', updateSettledLabelTop);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSettledLabelTop);
    };
  }, [points]);

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
          ref={chartContainerRef}
          sx={{
            left: { md: '-27px', xs: 0 },
            position: 'relative',
            width: '100%',
          }}
        >
          <LineChart
              height={chartHeight}
              xAxis={[
              {
                data: points.map((point) => point.timestamp),
                domainLimit: 'strict',
                max: lastPointTimestamp,
                min: points[0].timestamp,
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
                max: maxBalance,
                min: minBalance,
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
                label: 'Net balance',
                showMark: false,
                valueFormatter: (value, context) => {
                  const point = points[context.dataIndex];

                  if (!point) {
                    return value == null ? '' : formatCurrency(value, currencyCode);
                  }

                  if (point.pointType === 'start') {
                    return `${formatCurrency(point.balance, currencyCode)} · ${point.description}`;
                  }

                  return [
                    `${formatCurrency(point.balance, currencyCode)} current balance`,
                    `${formatSignedCurrency(point.delta, currencyCode)} change`,
                    point.description,
                  ].join(' · ');
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
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 1,
              pointerEvents: 'none',
              position: 'absolute',
              right: 12,
              top: settledLabelTop ?? zeroLineTop,
              transform: 'translateY(-50%)',
            }}
          >
            <Box
              sx={{
                borderTop: `1px dashed ${alpha(theme.palette.text.secondary, 0.6)}`,
                width: 12,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 1,
                lineHeight: 1,
                px: 0.5,
                py: 0.125,
              }}
            >
              Settled
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default DebtProgressChart;

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionStatus } from '../../../shared/types';
import DebtProgressChart from './DebtProgressChart';
import { buildDebtProgressData, formatDebtProgressTickLabel } from './debtProgressData';

jest.mock('@mui/x-charts', () => ({
  __esModule: true,
  ChartsReferenceLine: () => <div data-testid="zero-reference-line" />,
  LineChart: ({ children, height, series, slots, xAxis, yAxis }: any) => {
    const TooltipSlot = slots?.tooltip;

    return (
      <div data-testid="mock-line-chart" data-height={height}>
        <svg>
          <path data-testid="mock-zero-line" style={{ strokeDasharray: '4 4' }} />
        </svg>
        <div>
          {yAxis?.[0]?.valueFormatter?.(yAxis?.[0]?.min)}
          {yAxis?.[0]?.valueFormatter?.(0)}
          {yAxis?.[0]?.valueFormatter?.(yAxis?.[0]?.max)}
        </div>
        <div>
          {xAxis?.[0]?.data?.map((value: Date, index: number) => (
            <span key={`tick-${index}`}>{xAxis[0].valueFormatter?.(value, { location: 'tick' })}</span>
          ))}
        </div>
        <div>
          {series?.flatMap((seriesEntry: any, seriesIndex: number) => (
            seriesEntry?.data?.map((value: number | null, index: number) => (
              <span key={`value-${seriesIndex}-${index}`} data-series-color={seriesEntry.color}>
                {seriesEntry.valueFormatter?.(value, { dataIndex: index })}
              </span>
            ))
          ))}
        </div>
        {TooltipSlot ? <TooltipSlot /> : null}
        {children}
      </div>
    );
  },
}));

jest.mock('@mui/x-charts/ChartsTooltip', () => ({
  __esModule: true,
  ChartsTooltipContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tooltip-container">{children}</div>
  ),
  useAxisTooltip: jest.fn(() => ({
    axisFormattedValue: '01/04/2026',
    seriesItems: [{
      color: '#42a5f5',
      formattedValue: '€7.50 current balance · +€20.00 change · Dinner',
    }],
  })),
}));

describe('buildDebtProgressData', () => {
  const resizeObserverObserve = jest.fn();
  const resizeObserverDisconnect = jest.fn();
  const originalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    resizeObserverObserve.mockReset();
    resizeObserverDisconnect.mockReset();

    global.ResizeObserver = class ResizeObserver {
      observe = resizeObserverObserve;
      disconnect = resizeObserverDisconnect;
    } as unknown as typeof ResizeObserver;

    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
    jest.restoreAllMocks();
  });

  test('builds a signed running balance that starts at zero and crosses the settled line', () => {
    const points = buildDebtProgressData([
      {
        id: 'tx-2',
        payerPersonId: 'p2',
        payeePersonId: 'p1',
        amount: 12.5,
        currencyCode: 'EUR',
        transactionDateUtc: '2026-03-28T18:30:00Z',
        description: 'Taxi',
        status: TransactionStatus.Completed,
      },
      {
        id: 'tx-1',
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 20,
        currencyCode: 'EUR',
        transactionDateUtc: '2026-04-01T12:00:00Z',
        description: 'Dinner',
        status: TransactionStatus.Completed,
      },
    ], 'p2');

    expect(points).toHaveLength(3);
    expect(points.map((point) => point.balance)).toEqual([0, -12.5, 7.5]);
    expect(points.map((point) => point.delta)).toEqual([0, -12.5, 20]);
    expect(points[0].pointType).toBe('start');
    expect(points[1].timestamp.getTime() - points[0].timestamp.getTime()).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000);
    expect(points[1].label).toBe('28/03/2026');
    expect(points[2].label).toBe('01/04/2026');
  });

  test('formats year labels only for the first visible tick and January boundary', () => {
    const firstTransactionTimestamp = new Date('2025-12-02T10:00:00Z');

    const lastVisibleTimestamp = new Date('2026-04-11T00:00:00Z');

    expect(formatDebtProgressTickLabel(new Date('2025-11-30T00:00:00Z'), firstTransactionTimestamp, lastVisibleTimestamp)).toBe('30/11/2025');
    expect(formatDebtProgressTickLabel(new Date('2025-12-31T00:00:00Z'), firstTransactionTimestamp, lastVisibleTimestamp)).toBe('31/12');
    expect(formatDebtProgressTickLabel(new Date('2026-01-31T00:00:00Z'), firstTransactionTimestamp, lastVisibleTimestamp)).toBe('31/01/2026');
    expect(formatDebtProgressTickLabel(new Date('2026-02-28T00:00:00Z'), firstTransactionTimestamp, lastVisibleTimestamp)).toBe('28/02');
    expect(formatDebtProgressTickLabel(new Date('2026-04-06T00:00:00Z'), new Date('2026-04-04T00:00:00Z'), new Date('2026-04-11T00:00:00Z'))).toBe('06/04');
  });

  test('returns no points when there are no transactions', () => {
    expect(buildDebtProgressData([], 'p2')).toEqual([]);
  });

  test('renders the debt progression chart with the settled label and running balance details', () => {
    render(
      <DebtProgressChart
        transactions={[
          {
            id: 'tx-2',
            payerPersonId: 'p2',
            payeePersonId: 'p1',
            amount: 12.5,
            currencyCode: 'EUR',
            transactionDateUtc: '2026-03-28T18:30:00Z',
            description: 'Taxi',
            status: TransactionStatus.Completed,
          },
          {
            id: 'tx-1',
            payerPersonId: 'p1',
            payeePersonId: 'p2',
            amount: 20,
            currencyCode: 'EUR',
            transactionDateUtc: '2026-04-01T12:00:00Z',
            description: 'Dinner',
            status: TransactionStatus.Completed,
          },
        ]}
        counterpartyPersonId="p2"
        currencyCode="EUR"
      />,
    );

    expect(screen.getByText('Debt progression')).toBeInTheDocument();
    expect(screen.getByText(/Positive values mean they owe you/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-line-chart')).toHaveAttribute('data-height', '328');
    expect(screen.getAllByText(/Starting balance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/change.*Taxi/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/current balance.*Dinner/i)).toBeInTheDocument();
  });

  test('renders nothing when the transaction history is empty', () => {
    const { container } = render(
      <DebtProgressChart transactions={[]} counterpartyPersonId="p2" currencyCode="EUR" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

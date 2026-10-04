import { describe, expect, it } from 'vitest';

import { PaperTradingEngine, PaperTradingError } from '../../src/execution/paper-trading.js';
import { createCandle } from '../../src/market/candle.js';

const engine = () => new PaperTradingEngine({ feeRate: '0.001', initialBalance: '1000' });

const buyOrder = {
  entryPrice: '100',
  quantity: '1',
  stopLoss: '95',
  symbol: 'BTCUSDT',
  takeProfit: '110',
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
};

const candle = (low: string, high: string, close: string) =>
  createCandle({
    close,
    high,
    low,
    open: close,
    symbol: 'BTCUSDT',
    timeframe: '1h',
    timestamp: new Date('2026-01-01T01:00:00.000Z'),
    volume: '1',
  });

describe('PaperTradingEngine', () => {
  it('opens a valid BUY and reserves virtual balance plus entry fee', () => {
    const paper = engine();

    const position = paper.openPosition(buyOrder);

    expect(position.status).toBe('OPEN');
    expect(paper.balance.toString()).toBe('899.9');
    expect(paper.openPositionCount).toBe(1);
  });

  it('rejects an invalid BUY quantity', () => {
    expect(() => engine().openPosition({ ...buyOrder, quantity: '0' })).toThrow(PaperTradingError);
  });

  it('rejects a duplicate position', () => {
    const paper = engine();
    paper.openPosition(buyOrder);

    expect(() => paper.openPosition(buyOrder)).toThrow(PaperTradingError);
  });

  it('closes a valid SELL and calculates positive P&L including both fees', () => {
    const paper = engine();
    paper.openPosition(buyOrder);

    const trade = paper.closePosition({ price: '110', reason: 'SIGNAL', timestamp: new Date() });

    expect(trade.status).toBe('CLOSED');
    expect(trade.fees.toString()).toBe('0.21');
    expect(trade.profitLoss.toString()).toBe('9.79');
    expect(paper.balance.toString()).toBe('1009.79');
  });

  it('calculates negative P&L on a loss', () => {
    const paper = engine();
    paper.openPosition(buyOrder);

    expect(
      paper
        .closePosition({ price: '90', reason: 'SIGNAL', timestamp: new Date() })
        .profitLoss.toString(),
    ).toBe('-10.19');
  });

  it('rejects SELL when no position exists', () => {
    expect(() =>
      engine().closePosition({ price: '100', reason: 'SIGNAL', timestamp: new Date() }),
    ).toThrow(PaperTradingError);
  });

  it('closes at stop loss when the candle reaches it', () => {
    const paper = engine();
    paper.openPosition(buyOrder);

    const trade = paper.processCandle(candle('94', '105', '100'));

    expect(trade?.exitReason).toBe('STOP_LOSS');
    expect(trade?.exitPrice.toString()).toBe('95');
  });

  it('closes at take profit when the candle reaches it', () => {
    const paper = engine();
    paper.openPosition(buyOrder);

    const trade = paper.processCandle(candle('96', '111', '109'));

    expect(trade?.exitReason).toBe('TAKE_PROFIT');
    expect(trade?.exitPrice.toString()).toBe('110');
  });

  it('uses stop loss first when one candle reaches both protective prices', () => {
    const paper = engine();
    paper.openPosition(buyOrder);

    expect(paper.processCandle(candle('94', '111', '100'))?.exitReason).toBe('STOP_LOSS');
  });
});

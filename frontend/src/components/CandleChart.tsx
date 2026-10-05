import { CandlestickSeries, createChart, type UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

import type { CandleDto } from '../services/api';

export function CandleChart({ candles }: { candles: readonly CandleDto[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || candles.length === 0) return undefined;

    const chart = createChart(container, {
      height: 320,
      layout: { textColor: '#cbd5e1', background: { color: '#0f172a' } },
      width: container.clientWidth || 640,
    });
    const series = chart.addSeries(CandlestickSeries, {
      downColor: '#ef4444',
      upColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });
    series.setData(
      candles.map((candle) => ({
        close: Number(candle.close),
        high: Number(candle.high),
        low: Number(candle.low),
        open: Number(candle.open),
        time: (Date.parse(candle.timestamp) / 1000) as UTCTimestamp,
      })),
    );
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles]);

  if (candles.length === 0) return <p className="empty">No market candles available.</p>;
  return <div aria-label="Candlestick chart" className="chart" ref={containerRef} />;
}

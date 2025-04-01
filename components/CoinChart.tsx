'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData,
  ColorType, 
  CrosshairMode 
} from 'lightweight-charts';
import { CoinService } from '@/services/coinService';

const INTERVALS = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
type Interval = typeof INTERVALS[number];

interface CoinChartProps {
  symbol?: string;
  initialInterval?: Interval;
}

function calculateSMA(data: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
    result.push({
      time: data[i].time,
      value: sum / period
    });
  }
  return result;
}

function calculateRSI(data: CandlestickData[], period: number = 14): LineData[] {
  const changes = data.map((candle, index) => 
    index > 0 ? candle.close - data[index - 1].close : 0
  );

  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const result: LineData[] = [];
  const rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
  result.push({
    time: data[period].time,
    value: 100 - (100 / (1 + rs))
  });

  return result;
}

const CoinChart: React.FC<CoinChartProps> = ({ 
  symbol = 'BTCUSDT', 
  initialInterval = '1d' 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setInterval] = useState<Interval>(initialInterval);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CoinService.fetchChartData(symbol, interval);
      const formattedData = data.map(candle => ({
        time: candle.time as number,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }));
      setChartData(formattedData);
    } catch (error) {
      console.error('차트 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 600,
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: 'red',
        downColor: 'blue',
        borderVisible: false,
        wickUpColor: 'red',
        wickDownColor: 'blue',
      });

      const ma20Series = chart.addLineSeries({
        color: 'orange',
        lineWidth: 2,
        title: 'MA 20',
      });

      const ma50Series = chart.addLineSeries({
        color: 'purple',
        lineWidth: 2,
        title: 'MA 50',
      });

      const rsiSeries = chart.addLineSeries({
        color: 'green',
        lineWidth: 2,
        title: 'RSI',
      });

      const upperBandSeries = chart.addLineSeries({
        color: 'rgba(255, 0, 0, 0.5)',
        lineWidth: 1,
      });

      const lowerBandSeries = chart.addLineSeries({
        color: 'rgba(0, 128, 0, 0.5)',
        lineWidth: 1,
      });

      candleSeries.setData(chartData);
      
      const ma20Data = calculateSMA(chartData, 20);
      const ma50Data = calculateSMA(chartData, 50);
      const rsiData = calculateRSI(chartData);

      ma20Series.setData(ma20Data);
      ma50Series.setData(ma50Data);
      rsiSeries.setData(rsiData);

      upperBandSeries.setData(rsiData.map(item => ({
        time: item.time,
        value: 70
      })));

      lowerBandSeries.setData(rsiData.map(item => ({
        time: item.time,
        value: 30
      })));

      chart.timeScale().fitContent();
      chartRef.current = chart;

      const handleResize = () => {
        chart.resize(
          chartContainerRef.current?.clientWidth || 0, 
          600
        );
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {INTERVALS.map((int) => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              className={`px-2 py-1 rounded ${
                interval === int 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-black'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full h-[600px]"
      />
    </div>
  );
};

export default CoinChart;

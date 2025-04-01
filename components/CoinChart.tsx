'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createChart, IChartApi, CandlestickData, CrosshairMode } from 'lightweight-charts';
import { CoinChartProps, ChartData } from '@/types/coin';

const CoinChart: React.FC<CoinChartProps> = ({ symbol, data = [] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=100`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const rawData = await response.json();
      
      const formattedData: ChartData[] = rawData.map((candle: any) => ({
        time: parseInt(candle[0]) / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4])
      }));

      setChartData(formattedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (data.length > 0) {
      setChartData(data);
      setLoading(false);
    } else {
      fetchChartData();
    }
  }, [data, fetchChartData]);

  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderVisible: false,
        },
        timeScale: {
          borderVisible: false,
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: 'red',
        downColor: 'blue',
        borderVisible: false,
        wickUpColor: 'red',
        wickDownColor: 'blue',
      });

      candleSeries.setData(chartData);
      chart.timeScale().fitContent();

      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.resize(
            chartContainerRef.current.clientWidth, 
            500
          );
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    }
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[500px] text-red-500">
        {error}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[500px] text-gray-500">
        No chart data available
      </div>
    );
  }

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-[500px]"
    />
  );
};

export default CoinChart;

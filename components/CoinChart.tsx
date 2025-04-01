'use client';

import { useEffect, useState, useRef } from 'react';
import { createChart, IChartApi, CandlestickData, LineData, CrosshairMode } from 'lightweight-charts';
import { CoinData } from '@/types/coin';

// UTCTimestamp 타입 직접 정의
type UTCTimestamp = number;

interface CoinChartProps {
  symbol: string;
  data?: {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
}

export default function CoinChart({ symbol, data = [] }: CoinChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);

  // 데이터 가져오기 함수
  const fetchChartData = async () => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=100`);
      const rawData = await response.json();
      
      const formattedData = rawData.map((candle: any) => ({
        time: parseInt(candle[0]) / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4])
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  };

  useEffect(() => {
    // 외부에서 데이터가 전달되지 않았다면 API에서 가져오기
    if (!data || data.length === 0) {
      fetchChartData();
    } else {
      setChartData(data);
    }
  }, [symbol, data]);

  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      // 기존 차트 제거
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // 새 차트 생성
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

      // 캔들스틱 시리즈 추가
      const candleSeries = chart.addCandlestickSeries({
        upColor: 'red',
        downColor: 'blue',
        borderVisible: false,
        wickUpColor: 'red',
        wickDownColor: 'blue',
      });

      // 데이터 설정
      candleSeries.setData(chartData);

      // 차트 참조 저장
      chartRef.current = chart;

      // 리사이즈 핸들러
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.resize(
            chartContainerRef.current.clientWidth, 
            500
          );
        }
      };

      // 윈도우 리사이즈 이벤트 리스너 추가
      window.addEventListener('resize', handleResize);

      // 클린업 함수
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    }
  }, [chartData, symbol]);

  // 데이터 로딩 중 또는 데이터 없을 때
  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-[500px]"
    >
      {/* 차트가 여기에 렌더링됩니다 */}
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  ColorType, 
  LineStyle, 
  CrosshairMode 
} from 'lightweight-charts';
import { CoinService } from '@/services/coinService';

interface CoinChartProps {
  symbol: string;
  interval?: '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
}

const CoinChart: React.FC<CoinChartProps> = ({ 
  symbol = 'BTCUSDT', 
  interval = '1d' 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<CandlestickData> | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
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
      }
    };

    fetchChartData();
  }, [symbol, interval]);

  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      // 기존 차트 제거
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // 새 차트 생성
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

      // 차트 자동 크기 조정
      chart.timeScale().fitContent();

      // 참조 저장
      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;

      // 리사이즈 핸들러
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chart.resize(
            chartContainerRef.current.clientWidth, 
            600
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
  }, [chartData]);

  // 데이터 로딩 중 상태
  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-[600px]"
    >
      {/* 차트가 여기에 렌더링됩니다 */}
    </div>
  );
};

export default CoinChart;

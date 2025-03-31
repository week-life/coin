'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ExternalLink, ZoomIn, ZoomOut, MoveHorizontal, RefreshCw } from 'lucide-react';

interface CandleData {
  timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
}

interface CoinChartProps {
  symbol: string;
}

const TIMEFRAMES = ['1s', '15m', '1h', '4h', '1d', '1w', '1M'] as const;
type TimeFrame = typeof TIMEFRAMES[number];

const darkTheme = {
  background: '#1e222d',
  gridLines: '#363c4e',
  text: '#d1d4dc',
  priceUp: '#26a69a',
  priceDown: '#ef5350',
  ma7: '#f5c878',
  ma14: '#ff9eb4',
  ma30: '#67b7dc',
  ma60: '#5fbeaa',
  ma90: '#8067dc',
  ma120: '#2196f3',
  volume: '#5d6683',
  volumeUp: '#26a69a',
  volumeDown: '#ef5350',
  macd: '#2196f3',
  signal: '#ff9800',
  histogram: '#4caf50',
  rsi: '#ba68c8'
};

export default function CoinChart({ symbol }: CoinChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('4h');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(800);
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const fetchCandleData = async () => {
    try {
      setLoading(true);
      // 하드코딩된 데이터로 임시 대체
      const mockData: CandleData[] = [
        { 
          timestamp: 1711843200000, // 예시 타임스탬프
          opening_price: 83420.42,
          high_price: 83650.36,
          low_price: 83200.50,
          trade_price: 83456.50,
          candle_acc_trade_volume: 429298
        },
        // 여기에 더 많은 데이터 포인트 추가
      ];

      setData(mockData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('차트 데이터 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeChart = useCallback(() => {
    if (chartRef.current) {
      try {
        const chart = chartRef.current as any;
        if (typeof chart.remove === 'function') {
          chart.remove();
        } else if (typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (error) {
        console.error('차트 제거 중 오류:', error);
      }
      chartRef.current = null;
    }
  }, []);

  // 이동평균선 계산 함수들
  const calculateMA = (data: number[], period: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / period;
        result.push(avg);
      }
    }
    return result;
  };

  useEffect(() => {
    fetchCandleData();
  }, [symbol, timeFrame]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // 기존 차트 제거
    removeChart();

    // 가격 데이터 준비
    const prices = data.map(d => d.trade_price);
    const timestamps = data.map(d => d.timestamp / 1000);

    // 이동평균선 계산
    const maConfigs = [
      { period: 7, value: calculateMA(prices, 7), color: darkTheme.ma7 },
      { period: 14, value: calculateMA(prices, 14), color: darkTheme.ma14 },
      { period: 30, value: calculateMA(prices, 30), color: darkTheme.ma30 },
      { period: 60, value: calculateMA(prices, 60), color: darkTheme.ma60 },
      { period: 90, value: calculateMA(prices, 90), color: darkTheme.ma90 },
      { period: 120, value: calculateMA(prices, 120), color: darkTheme.ma120 }
    ];

    // 차트 생성
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: darkTheme.background },
        textColor: darkTheme.text,
      },
      grid: {
        vertLines: { color: darkTheme.gridLines },
        horzLines: { color: darkTheme.gridLines },
      },
      rightPriceScale: {
        borderColor: darkTheme.gridLines,
      },
      timeScale: {
        borderColor: darkTheme.gridLines,
      },
      crosshair: {
        mode: 1
      }
    });

    // 캔들스틱 시리즈
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: darkTheme.priceUp,
      downColor: darkTheme.priceDown,
      borderVisible: false,
      wickUpColor: darkTheme.priceUp,
      wickDownColor: darkTheme.priceDown,
    });

    const formattedCandleData = data.map(candle => ({
      time: candle.timestamp / 1000,
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
    }));

    candlestickSeries.setData(formattedCandleData);

    // 이동평균선 시리즈 추가
    maConfigs.forEach(({ period, value, color }) => {
      const maSeries = chart.addLineSeries({
        color: color,
        lineWidth: 2,
      });

      const maData = value.map((ma, index) => ({
        time: timestamps[index],
        value: ma
      }));

      maSeries.setData(maData);
    });

    chartRef.current = chart;

    return () => {
      removeChart();
    };
  }, [data, chartHeight, symbol, removeChart]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (chartContainerRef.current) {
      if (!isFullScreen) {
        chartContainerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div 
      className="space-y-4 p-4 rounded-lg" 
      style={{ 
        backgroundColor: darkTheme.background, 
        color: darkTheme.text 
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          {TIMEFRAMES.map((frame) => (
            <Button
              key={frame}
              variant={timeFrame === frame ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame(frame)}
            >
              {frame}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartHeight(h => Math.max(400, h - 200))}
            title="차트 높이 줄이기"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartHeight(h => h + 200)}
            title="차트 높이 늘리기"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullScreen}
            title={isFullScreen ? "전체화면 나가기" : "전체화면 보기"}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div 
        className="w-full bg-[#1e222d] rounded-lg overflow-x-auto"
        style={{ height: `${chartHeight}px` }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchCandleData}>다시 시도</Button>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}

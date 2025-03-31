'use client';

import { useState, useEffect, useRef } from 'react';
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
  initialData?: CandleData[];
}

const darkTheme = {
  background: '#1e222d',
  gridLines: '#363c4e',
  text: '#d1d4dc',
  priceUp: '#26a69a',
  priceDown: '#ef5350',
};

export default function CoinChart({ symbol, initialData = [] }: CoinChartProps) {
  const [data, setData] = useState<CandleData[]>(initialData);
  const [loading, setLoading] = useState<boolean>(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<string>('1d');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(600);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const fetchCandleData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coins/${symbol}/candles`);
      
      if (!response.ok) {
        throw new Error('캔들 데이터를 불러오는데 실패했습니다.');
      }
      
      const candleData = await response.json();
      setData(candleData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('차트 데이터 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData.length === 0) {
      fetchCandleData();
    }
  }, [symbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 기존 차트 제거
    if (chartRef.current) {
      if (typeof chartRef.current.destroy === 'function') {
        chartRef.current.destroy();
      } else if (typeof chartRef.current.remove === 'function') {
        chartRef.current.remove();
      }
    }

    // 새 차트 생성
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
    });

    // 캔들스틱 시리즈 추가
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: darkTheme.priceUp,
      downColor: darkTheme.priceDown,
      borderVisible: false,
      wickUpColor: darkTheme.priceUp,
      wickDownColor: darkTheme.priceDown,
    });

    // 데이터 포맷팅
    const formattedData: CandlestickData[] = data.map(candle => ({
      time: candle.timestamp / 1000, // 밀리초를 초로 변환
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
    }));

    // 데이터 설정
    candlestickSeries.setData(formattedData);

    chartRef.current = chart;

    return () => {
      if (chart) {
        if (typeof chart.destroy === 'function') {
          chart.destroy();
        } else if (typeof chart.remove === 'function') {
          chart.remove();
        }
      }
    };
  }, [data, chartHeight, symbol]);

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

  const renderChartContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchCandleData}>다시 시도</Button>
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>
      );
    }

    return <div ref={chartContainerRef} className="w-full h-full" />;
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
          {['1d', '1h', '15m', '5m'].map((frame) => (
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
        {renderChartContent()}
      </div>
    </div>
  );
}

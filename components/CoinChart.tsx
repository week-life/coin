'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line, Bar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ExternalLink, ZoomIn, ZoomOut, MoveHorizontal, RefreshCw } from 'lucide-react';
import { formatTimestamp, calculateMA, calculateRSI, calculateBollingerBands, calculateMACD } from '@/lib/utils';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface CandleData {
  timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
  candle_acc_trade_price: number;
  closing_price?: number;
  volume?: number;
}

interface CoinChartProps {
  symbol: string;
  initialData?: CandleData[];
}

type ChartType = 'tradingview';
type TimeFrame = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
type Indicator = 'ma' | 'volume' | 'macd' | 'rsi';

interface LineDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  borderWidth?: number;
  pointRadius?: number;
  yAxisID?: string;
  borderDash?: number[];
  fill?: boolean;
  order?: number;
}

interface BarDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  yAxisID?: string;
  order?: number;
}

const timeFrameMapping: Record<TimeFrame, { unit: string; value: number }> = {
  '1m': { unit: 'minutes', value: 1 },
  '3m': { unit: 'minutes', value: 3 },
  '5m': { unit: 'minutes', value: 5 },
  '15m': { unit: 'minutes', value: 15 },
  '30m': { unit: 'minutes', value: 30 },
  '1h': { unit: 'minutes', value: 60 },
  '4h': { unit: 'minutes', value: 240 },
  '1d': { unit: 'days', value: 1 },
  '1w': { unit: 'weeks', value: 1 },
  '1M': { unit: 'months', value: 1 }
};

// 트레이딩뷰 스타일 색상
const darkThemeColors = {
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

export default function CoinChart({ symbol, initialData = [] }: CoinChartProps) {
  const [data, setData] = useState<CandleData[]>(initialData);
  const [loading, setLoading] = useState<boolean>(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [chartType] = useState<ChartType>('tradingview');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1d');
  const [indicators, setIndicators] = useState<Indicator[]>(['ma', 'volume', 'macd', 'rsi']);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(800);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const priceChartRef = useRef<any>(null);
  const volumeChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  
  // 차트 새 창으로 열기
  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!newWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${symbol} 차트 - ${timeFrame}</title>
        <style>
          body { margin: 0; padding: 20px; background-color: #1e222d; color: #d1d4dc; font-family: Arial, sans-serif; }
          .chart-container { width: 100%; height: calc(100vh - 80px); }
          h1 { margin-top: 0; }
          .info { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${symbol} 차트</h1>
        <div class="info">
          <p>시간 프레임: ${timeFrame}</p>
        </div>
        <div class="chart-container">
          <img alt="${symbol} 차트" style="max-width: 100%; max-height: 100%;">
        </div>
      </body>
      </html>
    `);
    
    newWindow.document.close();
  };

  // 풀스크린 토글
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (chartContainerRef.current) {
      if (!isFullScreen) {
        if (chartContainerRef.current.requestFullscreen) {
          chartContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  // 차트 높이 조절
  const increaseChartHeight = () => {
    setChartHeight(prev => prev + 200);
  };

  const decreaseChartHeight = () => {
    setChartHeight(prev => Math.max(400, prev - 200));
  };

  // 차트 줌 초기화
  const resetZoom = () => {
    if (priceChartRef.current) {
      priceChartRef.current.resetZoom();
    }
    if (volumeChartRef.current && indicators.includes('volume')) {
      volumeChartRef.current.resetZoom();
    }
    if (macdChartRef.current && indicators.includes('macd')) {
      macdChartRef.current.resetZoom();
    }
    if (rsiChartRef.current && indicators.includes('rsi')) {
      rsiChartRef.current.resetZoom();
    }
  };

  // 캔들 데이터 조회
  const fetchCandleData = async () => {
    try {
      setLoading(true);
      
      const { unit, value } = timeFrameMapping[timeFrame];
      const endpoint = `/api/coins/${symbol}/candles/${unit}/${value}?count=100`;
      console.log('차트 데이터 요청 엔드포인트:', endpoint);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`차트 데이터를 불러오는데 실패했습니다. 상태 코드: ${response.status}`);
      }
      
      const candleData = await response.json();
      
      if (!candleData || !Array.isArray(candleData)) {
        console.error('유효하지 않은 캔들 데이터 응답:', candleData);
        throw new Error('유효하지 않은 캔들 데이터 응답을 받았습니다.');
      }
      
      console.log('응답 받은 캔들 데이터:', candleData.length, '개 항목');
      
      if (candleData.length > 0) {
        console.log('첫 번째 캔들 데이터 샘플:', candleData[0]);
        console.log('마지막 캔들 데이터 샘플:', candleData[candleData.length - 1]);
      }
      
      setData(candleData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('차트 데이터 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  // 최초 마운트 시 차트 데이터 가져오기
  useEffect(() => {
    if (initialData.length === 0) {
      fetchCandleData();
    }
  }, [symbol, timeFrame, initialData.length]);

  // 풀스크린 변경 이벤트 리스너
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // 이동평균선 계산
  const calculateMAs = (prices: number[]) => {
    return {
      ma7: calculateMA(prices, 7),
      ma14: calculateMA(prices, 14),
      ma30: calculateMA(prices, 30),
      ma60: calculateMA(prices, 60),
      ma90: calculateMA(prices, 90),
      ma120: calculateMA(prices, 120)
    };
  };
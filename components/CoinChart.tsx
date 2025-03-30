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
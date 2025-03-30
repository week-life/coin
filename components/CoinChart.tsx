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
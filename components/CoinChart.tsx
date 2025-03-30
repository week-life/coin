'use client';

import { useState, useEffect } from 'react';
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
import { Line, Bar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
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
  Filler
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

type ChartType = 'price' | 'volume' | 'technicals';
type TimeFrame = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1M';

// 타입스크립트 오류 해결을 위한 추가 인터페이스
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
}

interface BarDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

const timeFrameMapping: Record<TimeFrame, { unit: string; value: number }> = {
  '1m': { unit: 'minutes', value: 1 },
  '3m': { unit: 'minutes', value: 3 },
  '5m': { unit: 'minutes', value: 5 },
  '15m': { unit: 'minutes', value: 15 },
  '30m': { unit: 'minutes', value: 30 },
  '1h': { unit: 'minutes', value: 60 },
  '1d': { unit: 'days', value: 1 },
  '1w': { unit: 'weeks', value: 1 },
  '1M': { unit: 'months', value: 1 }
};

export default function CoinChart({ symbol, initialData = [] }: CoinChartProps) {
  const [data, setData] = useState<CandleData[]>(initialData);
  const [loading, setLoading] = useState<boolean>(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('price');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1d');
  const [showMA, setShowMA] = useState<boolean>(true);
  const [showBB, setShowBB] = useState<boolean>(false);

  // 캔들 데이터 조회
  const fetchCandleData = async () => {
    try {
      setLoading(true);
      
      const { unit, value } = timeFrameMapping[timeFrame];
      const endpoint = `/api/coins/${symbol}/candles/${unit}/${value}?count=100`;
      console.log('차트 데이터 요청 엔드포인트:', endpoint);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('차트 데이터를 불러오는데 실패했습니다.');
      }
      
      const candleData = await response.json();
      console.log('응답 받은 캔들 데이터:', candleData.length, '개 항목');
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

  // 가격 차트 데이터
  const getPriceChartData = () => {
    if (!data.length) return { labels: [], datasets: [] };
    
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    console.log('정렬된 데이터 샘플:', sortedData.slice(0, 2));
    
    const labels = sortedData.map(candle => formatTimestamp(candle.timestamp));
    const prices = sortedData.map(candle => {
      // API 응답이 trade_price 또는 closing_price 중 하나를 사용할 수 있음
      return candle.trade_price || candle.closing_price || 0;
    });
    
    console.log('차트 라벨 샘플:', labels.slice(0, 3));
    console.log('가격 데이터 샘플:', prices.slice(0, 3));
    
    const datasets: LineDataset[] = [
      {
        label: '가격',
        data: prices,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1
      }
    ];
    
    // 이동평균선 추가
    if (showMA) {
      const ma5 = calculateMA(prices, 5);
      const ma20 = calculateMA(prices, 20);
      
      datasets.push(
        {
          label: 'MA5',
          data: ma5,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          backgroundColor: 'rgba(255, 99, 132, 0)'
        },
        {
          label: 'MA20',
          data: ma20,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          backgroundColor: 'rgba(75, 192, 192, 0)'
        }
      );
    }
    
    // 볼린저 밴드 추가
    if (showBB) {
      const { upper, middle, lower } = calculateBollingerBands(prices);
      
      datasets.push(
        {
          label: '볼린저 상단',
          data: upper,
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          tension: 0.1,
          backgroundColor: 'rgba(255, 159, 64, 0)'
        },
        {
          label: '볼린저 중단',
          data: middle,
          borderColor: 'rgba(255, 159, 64, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          backgroundColor: 'rgba(255, 159, 64, 0)'
        },
        {
          label: '볼린저 하단',
          data: lower,
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          tension: 0.1,
          backgroundColor: 'rgba(255, 159, 64, 0)'
        }
      );
    }
    
    return { labels, datasets };
  };

  // 거래량 차트 데이터
  const getVolumeChartData = () => {
    if (!data.length) return { labels: [], datasets: [] };
    
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    const labels = sortedData.map(candle => formatTimestamp(candle.timestamp));
    const volumes = sortedData.map(candle => candle.candle_acc_trade_volume || candle.volume || 0);
    
    // 색상 계산 (상승/하락 구분)
    const colors = sortedData.map((candle, index, arr) => {
      if (index === 0) return 'rgba(53, 162, 235, 0.5)';
      const prevCandle = arr[index - 1];
      return candle.trade_price >= prevCandle.trade_price
        ? 'rgba(75, 192, 192, 0.5)' // 상승 또는 유지 (초록)
        : 'rgba(255, 99, 132, 0.5)'; // 하락 (빨강)
    });
    
    const borderColors = colors.map(color => color.replace('0.5', '1'));
    
    const datasets: BarDataset[] = [
      {
        label: '거래량',
        data: volumes,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1
      }
    ];
    
    return { labels, datasets };
  };

  // 기술적 지표 차트 데이터
  const getTechnicalChartData = () => {
    if (!data.length) return { labels: [], datasets: [] };
    
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    const labels = sortedData.map(candle => formatTimestamp(candle.timestamp));
    const prices = sortedData.map(candle => candle.trade_price || candle.closing_price || 0);
    
    // RSI 계산
    const rsiValues = calculateRSI(prices);
    
    // MACD 계산
    const { macd, signal, histogram } = calculateMACD(prices);
    
    const datasets: LineDataset[] = [
      {
        label: 'RSI',
        data: rsiValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
        tension: 0.1
      },
      {
        label: 'MACD',
        data: macd,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y1',
        tension: 0.1
      },
      {
        label: 'Signal',
        data: signal,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        yAxisID: 'y1',
        tension: 0.1
      }
    ];
    
    return { labels, datasets };
  };

  // 차트 옵션 설정
  const getChartOptions = () => {
    if (chartType === 'technicals') {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: {
              display: true,
              text: 'RSI'
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false
            }
          },
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            title: {
              display: true,
              text: 'MACD'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      };
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: chartType === 'price' 
            ? `${symbol} 가격 차트` 
            : `${symbol} 거래량 차트`,
        },
      },
    };
  };

  // 차트 렌더링
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchCandleData}>다시 시도</Button>
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>
      );
    }

    switch (chartType) {
      case 'price':
        return <Line data={getPriceChartData()} options={getChartOptions()} />;
      case 'volume':
        return <Bar data={getVolumeChartData()} options={getChartOptions()} />;
      case 'technicals':
        return <Line data={getTechnicalChartData()} options={getChartOptions()} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <Button
            variant={chartType === 'price' ? 'default' : 'outline'}
            onClick={() => setChartType('price')}
            size="sm"
          >
            가격
          </Button>
          <Button
            variant={chartType === 'volume' ? 'default' : 'outline'}
            onClick={() => setChartType('volume')}
            size="sm"
          >
            거래량
          </Button>
          <Button
            variant={chartType === 'technicals' ? 'default' : 'outline'}
            onClick={() => setChartType('technicals')}
            size="sm"
          >
            기술적 지표
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {Object.keys(timeFrameMapping).map((tf) => (
            <Button
              key={tf}
              variant={timeFrame === tf ? 'default' : 'outline'}
              onClick={() => setTimeFrame(tf as TimeFrame)}
              size="sm"
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>
      
      {chartType === 'price' && (
        <div className="flex gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showMA}
              onChange={() => setShowMA(!showMA)}
            />
            이동평균선
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showBB}
              onChange={() => setShowBB(!showBB)}
            />
            볼린저 밴드
          </label>
        </div>
      )}
      
      <div className="h-[500px] w-full">
        {renderChart()}
      </div>
    </div>
  );
}
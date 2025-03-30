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
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line, Bar, Chart } from 'react-chartjs-2';
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
  zoomPlugin,
  CandlestickController,
  CandlestickElement
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

interface CandlestickData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
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

  // 캔들스틱 데이터 준비
  const getCandlestickData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // 데이터 역순 정렬 (최신 데이터가 오른쪽으로)
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // 라벨 (날짜/시간) 준비
    const labels = sortedData.map(item => formatTimestamp(item.timestamp));
    
    // 가격 데이터 준비
    const prices = sortedData.map(item => item.trade_price);
    
    // 캔들스틱 데이터 준비
    const candlestickData = sortedData.map(item => ({
      x: item.timestamp,
      o: item.opening_price,
      h: item.high_price,
      l: item.low_price,
      c: item.trade_price
    }));

    // 이동평균선 계산
    const { ma7, ma14, ma30, ma60, ma90, ma120 } = calculateMAs(prices);
    
    // 데이터셋 준비
    const datasets: any[] = [
      {
        label: '캔들',
        data: candlestickData,
        color: {
          up: darkThemeColors.priceUp,
          down: darkThemeColors.priceDown,
          unchanged: '#888888',
        },
        borderWidth: 1,
        yAxisID: 'y'
      }
    ];
    
    // 이동평균선 추가
    if (indicators.includes('ma')) {
      datasets.push(
        {
          type: 'line',
          label: 'MA7',
          data: sortedData.map((item, index) => ({
            x: item.timestamp,
            y: ma7[index] || null
          })),
          borderColor: darkThemeColors.ma7,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'MA14',
          data: sortedData.map((item, index) => ({
            x: item.timestamp,
            y: ma14[index] || null
          })),
          borderColor: darkThemeColors.ma14,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'MA30',
          data: sortedData.map((item, index) => ({
            x: item.timestamp,
            y: ma30[index] || null
          })),
          borderColor: darkThemeColors.ma30,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'MA60',
          data: sortedData.map((item, index) => ({
            x: item.timestamp,
            y: ma60[index] || null
          })),
          borderColor: darkThemeColors.ma60,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'MA90',
          data: sortedData.map((item, index) => ({
            x: item.timestamp,
            y: ma90[index] || null
          })),
          borderColor: darkThemeColors.ma90,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'MA120',
          data: sortedData.map((item, index) => ({
            x: item.timestamp,
            y: ma120[index] || null
          })),
          borderColor: darkThemeColors.ma120,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y'
        }
      );
    }
    
    return {
      labels,
      datasets
    };
  };
  // 볼륨 차트 데이터 준비
  const getVolumeChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // 데이터 역순 정렬
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // 라벨 (날짜/시간) 준비
    const labels = sortedData.map(item => formatTimestamp(item.timestamp));
    
    // 거래량 데이터 준비
    const volumes = sortedData.map(item => item.candle_acc_trade_volume);
    
    // 가격 변화에 따른 색상 결정
    const colors = sortedData.map((item, index, arr) => {
      if (index === 0) return darkThemeColors.volumeUp;
      return item.trade_price >= arr[index - 1].trade_price ? darkThemeColors.volumeUp : darkThemeColors.volumeDown;
    });
    
    // 데이터셋 준비
    const datasets: BarDataset[] = [
      {
        label: '거래량',
        data: volumes,
        backgroundColor: colors,
        borderColor: 'transparent',
        borderWidth: 0,
        yAxisID: 'y'
      }
    ];
    
    return {
      labels,
      datasets
    };
  };

  // MACD 차트 데이터 준비
  const getMACDChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // 데이터 역순 정렬
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // 라벨 (날짜/시간) 준비
    const labels = sortedData.map(item => formatTimestamp(item.timestamp));
    
    // 가격 데이터
    const prices = sortedData.map(item => item.trade_price);
    
    // MACD 계산
    const macdData = calculateMACD(prices);
    
    // 데이터셋 준비
    const datasets: (LineDataset | BarDataset)[] = [
      {
        label: 'MACD',
        data: macdData.macd,
        borderColor: darkThemeColors.macd,
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y',
        order: 1
      },
      {
        label: 'Signal',
        data: macdData.signal,
        borderColor: darkThemeColors.signal,
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y',
        order: 1
      },
      {
        label: 'Histogram',
        data: macdData.histogram,
        backgroundColor: macdData.histogram.map(value => value >= 0 ? darkThemeColors.volumeUp : darkThemeColors.volumeDown),
        yAxisID: 'y',
        order: 2
      } as BarDataset
    ];
    
    return {
      labels,
      datasets
    };
  };

  // RSI 차트 데이터 준비
  const getRSIChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // 데이터 역순 정렬
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // 라벨 (날짜/시간) 준비
    const labels = sortedData.map(item => formatTimestamp(item.timestamp));
    
    // 가격 데이터
    const prices = sortedData.map(item => item.trade_price);
    
    // RSI 계산 (기본 14일)
    const rsiData = calculateRSI(prices, 14);
    
    // 70, 30 기준선 준비
    const overBought = Array(labels.length).fill(70);
    const overSold = Array(labels.length).fill(30);
    const middle = Array(labels.length).fill(50);
    
    // 데이터셋 준비
    const datasets: LineDataset[] = [
      {
        label: 'RSI (14)',
        data: rsiData,
        borderColor: darkThemeColors.rsi,
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y'
      },
      {
        label: '과매수 (70)',
        data: overBought,
        borderColor: 'rgba(255, 0, 0, 0.5)',
        backgroundColor: 'transparent',
        tension: 0,
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        yAxisID: 'y'
      },
      {
        label: '중간 (50)',
        data: middle,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'transparent',
        tension: 0,
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
        yAxisID: 'y'
      },
      {
        label: '과매도 (30)',
        data: overSold,
        borderColor: 'rgba(0, 255, 0, 0.5)',
        backgroundColor: 'transparent',
        tension: 0,
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        yAxisID: 'y'
      }
    ];
    
    return {
      labels,
      datasets
    };
  };

  // 캔들스틱 차트 옵션
  const getCandlestickChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: darkThemeColors.text,
            boxWidth: 12,
            padding: 5
          }
        },
        title: {
          display: true,
          text: `${symbol.toUpperCase()} - ${timeFrame}`,
          color: darkThemeColors.text,
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 10,
            bottom: 30
          }
        },
        tooltip: {
          intersect: false,
          backgroundColor: darkThemeColors.background,
          titleColor: darkThemeColors.text,
          bodyColor: darkThemeColors.text,
          borderColor: darkThemeColors.gridLines,
          borderWidth: 1,
          mode: 'index' as const,
          callbacks: {
            label: (context: any) => {
              const item = context.raw;
              if (item && item.o !== undefined) {
                return [
                  `시가: ${item.o.toLocaleString()}`,
                  `고가: ${item.h.toLocaleString()}`,
                  `저가: ${item.l.toLocaleString()}`,
                  `종가: ${item.c.toLocaleString()}`
                ];
              }
              return context.dataset.label + ': ' + context.parsed.y;
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x' as const
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x' as const
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MM/dd'
            }
          },
          ticks: {
            maxRotation: 0,
            color: darkThemeColors.text,
            autoSkip: true,
            maxTicksLimit: 12
          },
          grid: {
            color: darkThemeColors.gridLines,
            display: true
          },
          // 스크롤바 추가
          display: true
        },
        y: {
          position: 'right' as const,
          ticks: {
            color: darkThemeColors.text
          },
          grid: {
            color: darkThemeColors.gridLines,
            display: true
          }
        }
      },
      elements: {
        candlestick: {
          color: {
            up: darkThemeColors.priceUp,
            down: darkThemeColors.priceDown,
            unchanged: '#888888',
          }
        }
      }
    };
  };

  // 볼륨 차트 옵션
  const getVolumeChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: '거래량',
          color: darkThemeColors.text,
          font: {
            size: 14
          },
          padding: {
            top: 10,
            bottom: 10
          }
        },
        tooltip: {
          intersect: false,
          backgroundColor: darkThemeColors.background,
          titleColor: darkThemeColors.text,
          bodyColor: darkThemeColors.text,
          borderColor: darkThemeColors.gridLines,
          borderWidth: 1,
          mode: 'index' as const
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x' as const
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x' as const
          }
        }
      },
      scales: {
        x: {
          display: false, // x축 표시 안함 (메인 차트와 동기화)
        },
        y: {
          position: 'right' as const,
          ticks: {
            color: darkThemeColors.text
          },
          grid: {
            color: darkThemeColors.gridLines,
            display: true
          }
        }
      }
    };
  };

  // MACD 차트 옵션
  const getMACDChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: darkThemeColors.text,
            boxWidth: 12,
            padding: 5
          }
        },
        title: {
          display: true,
          text: 'MACD (12, 26, 9)',
          color: darkThemeColors.text,
          font: {
            size: 14
          },
          padding: {
            top: 10,
            bottom: 10
          }
        },
        tooltip: {
          intersect: false,
          backgroundColor: darkThemeColors.background,
          titleColor: darkThemeColors.text,
          bodyColor: darkThemeColors.text,
          borderColor: darkThemeColors.gridLines,
          borderWidth: 1,
          mode: 'index' as const
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x' as const
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x' as const
          }
        }
      },
      scales: {
        x: {
          display: false, // x축 표시 안함 (메인 차트와 동기화)
        },
        y: {
          position: 'right' as const,
          ticks: {
            color: darkThemeColors.text
          },
          grid: {
            color: darkThemeColors.gridLines,
            display: true
          }
        }
      }
    };
  };

  // RSI 차트 옵션
  const getRSIChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'RSI (14)',
          color: darkThemeColors.text,
          font: {
            size: 14
          },
          padding: {
            top: 10,
            bottom: 10
          }
        },
        tooltip: {
          intersect: false,
          backgroundColor: darkThemeColors.background,
          titleColor: darkThemeColors.text,
          bodyColor: darkThemeColors.text,
          borderColor: darkThemeColors.gridLines,
          borderWidth: 1,
          mode: 'index' as const
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x' as const
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x' as const
          }
        }
      },
      scales: {
        x: {
          display: false, // x축 표시 안함 (메인 차트와 동기화)
        },
        y: {
          position: 'right' as const,
          ticks: {
            color: darkThemeColors.text,
            min: 0,
            max: 100,
            stepSize: 20 // 0, 20, 40, 60, 80, 100 표시
          },
          grid: {
            color: darkThemeColors.gridLines,
            display: true
          }
        }
      }
    };
  };

  // 차트 간 동기화 핸들러 - 이벤트 등록
  useEffect(() => {
    // 차트 인스턴스가 모두 생성된 후에만 실행
    if (!priceChartRef.current) return;
    
    // 차트 이벤트 핸들러
    const handleZoom = (event: any) => {
      if (!event || !event.chart) return;
      
      const sourceChart = event.chart;
      const sourceMin = sourceChart.scales.x.min;
      const sourceMax = sourceChart.scales.x.max;
      
      // 모든 차트 인스턴스 배열 (null이 아닌 것만 필터링)
      const chartInstances = [
        volumeChartRef.current,
        macdChartRef.current,
        rsiChartRef.current
      ].filter(Boolean);
      
      // 각 차트 동기화
      chartInstances.forEach(chart => {
        if (chart) {
          chart.zoomScale('x', {
            min: sourceMin,
            max: sourceMax
          });
          chart.update('none'); // 성능을 위해 애니메이션 없이 업데이트
        }
      });
    };
    
    // 메인 차트에 이벤트 리스너 추가
    const chartElement = priceChartRef.current;
    
    // 드래그 핸들러 정의
    const handleDrag = () => {
      // 드래그 중에는 빈 함수
    };
    
    if (chartElement) {
      // 줌 이벤트 활성화
      chartElement.options.plugins.zoom.zoom.onZoom = handleZoom;
      chartElement.options.plugins.zoom.pan.onPan = handleZoom;
      
      // 이벤트 리스너 등록
      chartElement.canvas.addEventListener('wheel', () => {
        setTimeout(() => handleZoom({ chart: chartElement }), 0);
      });
      
      chartElement.canvas.addEventListener('mousedown', () => {
        chartElement.canvas.addEventListener('mousemove', handleDrag);
      });
      
      chartElement.canvas.addEventListener('mouseup', () => {
        chartElement.canvas.removeEventListener('mousemove', handleDrag);
        setTimeout(() => handleZoom({ chart: chartElement }), 0);
      });
      
      chartElement.canvas.addEventListener('mouseout', () => {
        chartElement.canvas.removeEventListener('mousemove', handleDrag);
      });
    }
    
    return () => {
      // 클린업 함수
      if (chartElement && chartElement.canvas) {
        chartElement.canvas.removeEventListener('wheel', () => {});
        chartElement.canvas.removeEventListener('mousedown', () => {});
        chartElement.canvas.removeEventListener('mouseup', () => {});
        chartElement.canvas.removeEventListener('mouseout', () => {});
        chartElement.canvas.removeEventListener('mousemove', handleDrag);
      }
    };
  }, [priceChartRef.current, indicators]);

  // 차트 렌더링
  const renderCharts = () => {
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

    try {
      console.log('차트 렌더링 시작...');
      
      // 각 차트 데이터 및 옵션 얻기
      const candlestickData = getCandlestickData();
      const candlestickOptions = getCandlestickChartOptions();
      
      // 차트 영역 렌더링
      return (
        <div className="flex flex-col w-full space-y-2">
          {/* 메인 캔들스틱 차트 영역 - 더 큰 높이 할당 */}
          <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.6)}px` }}>
            <Chart 
              type="candlestick"
              data={candlestickData} 
              options={candlestickOptions}
              ref={(ref) => {
                if (ref) {
                  priceChartRef.current = ref;
                }
              }}
            />
          </div>
          
          {/* 거래량 차트 영역 */}
          {indicators.includes('volume') && (
            <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.13)}px` }}>
              <Bar 
                data={getVolumeChartData()} 
                options={getVolumeChartOptions()}
                ref={(ref) => {
                  if (ref) {
                    volumeChartRef.current = ref;
                  }
                }}
              />
            </div>
          )}

          {/* MACD 차트 영역 */}
          {indicators.includes('macd') && (
            <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.13)}px` }}>
              <Line 
                data={getMACDChartData()} 
                options={getMACDChartOptions()}
                ref={(ref) => {
                  if (ref) {
                    macdChartRef.current = ref;
                  }
                }}
              />
            </div>
          )}

          {/* RSI 차트 영역 */}
          {indicators.includes('rsi') && (
            <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.13)}px` }}>
              <Line 
                data={getRSIChartData()} 
                options={getRSIChartOptions()}
                ref={(ref) => {
                  if (ref) {
                    rsiChartRef.current = ref;
                  }
                }}
              />
            </div>
          )}
        </div>
      );
    } catch (err) {
      console.error('차트 렌더링 오류:', err);
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <p className="text-red-500">차트 렌더링 중 오류가 발생했습니다.</p>
          <Button onClick={fetchCandleData}>다시 시도</Button>
        </div>
      );
    }
  };

  // 지표 토글 함수
  const toggleIndicator = (indicator: Indicator) => {
    setIndicators(prev => {
      if (prev.includes(indicator)) {
        return prev.filter(i => i !== indicator);
      } else {
        return [...prev, indicator];
      }
    });
  };
  return (
    <div className="space-y-4" style={{ backgroundColor: darkThemeColors.background, color: darkThemeColors.text, padding: '20px', borderRadius: '8px' }}>
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <Button
            variant={indicators.includes('ma') ? 'default' : 'outline'}
            onClick={() => toggleIndicator('ma')}
            size="sm"
          >
            이동평균
          </Button>
          <Button
            variant={indicators.includes('volume') ? 'default' : 'outline'}
            onClick={() => toggleIndicator('volume')}
            size="sm"
          >
            거래량
          </Button>
          <Button
            variant={indicators.includes('macd') ? 'default' : 'outline'}
            onClick={() => toggleIndicator('macd')}
            size="sm"
          >
            MACD
          </Button>
          <Button
            variant={indicators.includes('rsi') ? 'default' : 'outline'}
            onClick={() => toggleIndicator('rsi')}
            size="sm"
          >
            RSI
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
      
      <div className="flex justify-between items-center mb-2">
        <div>
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={openInNewWindow}
            title="새 창에서 열기"
          >
            <ExternalLink className="h-4 w-4 mr-1" /> 새 창
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            title="차트 초기화"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> 초기화
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={decreaseChartHeight}
            title="차트 높이 줄이기"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={increaseChartHeight}
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
      
      <div className="p-2 bg-[#1e222d] rounded-md mb-2 text-white text-sm flex items-center border border-[#363c4e]">
        <MoveHorizontal className="h-4 w-4 mr-2" />
        스크롤 바를 사용하여 날짜를 확인하거나, 마우스 휠을 사용하여 확대/축소할 수 있습니다.
      </div>
      
      <div 
        ref={chartContainerRef}
        className="w-full bg-[#1e222d] p-4 rounded-lg transition-all duration-300 ease-in-out border border-[#363c4e] overflow-x-auto"
        style={{ height: `${chartHeight}px` }}
      >
        {renderCharts()}
      </div>
    </div>
  );
}

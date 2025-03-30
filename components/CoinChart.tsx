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
import { Line, Bar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
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

type ChartType = 'tradingview';
type TimeFrame = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
type Indicator = 'ma' | 'volume' | 'macd' | 'rsi';

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
  '4h': { unit: 'minutes', value: 240 }, // 4시간 봉 추가
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
  const [chartHeight, setChartHeight] = useState(800); // 기본 높이를 800px로 늘림
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // 차트 새 창으로 열기
  const openInNewWindow = () => {
    // 새 창에 표시할 HTML 생성
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!newWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    // 새 창에 필요한 스타일과 내용 추가
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
          <p>이 차트는 새 창에서 열려 있습니다. 더 자세한 분석을 위해 트레이딩뷰에서 확인하는 것을 권장합니다.</p>
        </div>
        <div class="chart-container">
          <img src="data:image/png;base64,${chartToBase64()}" alt="${symbol} 차트" style="max-width: 100%; max-height: 100%;">
        </div>
      </body>
      </html>
    `);
    
    newWindow.document.close();
  };

  // 차트를 이미지로 변환 (실제 구현은 복잡할 수 있으므로 간단한 placeholder 함수)
  const chartToBase64 = (): string => {
    // 실제로는 Chart.js의 toBase64Image() 메서드를 사용해야 하지만, 
    // 여기서는 구현의 복잡성 때문에 빈 문자열 반환
    return '';
  };

  // 풀스크린 토글
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (chartContainerRef.current) {
      if (!isFullScreen) {
        // 풀스크린으로 전환
        if (chartContainerRef.current.requestFullscreen) {
          chartContainerRef.current.requestFullscreen();
        }
      } else {
        // 풀스크린 해제
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  // 차트 높이 증가
  const increaseChartHeight = () => {
    setChartHeight(prev => prev + 200);
  };

  // 차트 높이 감소
  const decreaseChartHeight = () => {
    setChartHeight(prev => Math.max(400, prev - 200)); // 최소 400px 유지
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

  // 이동평균선 계산 - 여러 기간에 대한 MA 계산
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

  // 트레이딩뷰 스타일 차트 데이터
  const getTradingViewChartData = () => {
    if (!data.length) {
      console.log('차트 데이터가 없습니다.');
      return { labels: [], datasets: [] };
    }
    
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    console.log('정렬된 데이터 개수:', sortedData.length);
    
    const labels = sortedData.map(candle => formatTimestamp(candle.timestamp));
    
    // 가격 데이터 추출
    const prices = sortedData.map(candle => {
      const price = candle.trade_price || candle.closing_price || 0;
      if (!price || isNaN(price)) {
        console.warn('유효하지 않은 가격 데이터:', candle);
        return 0;
      }
      return price;
    });
    
    const volumes = sortedData.map(candle => candle.candle_acc_trade_volume || candle.volume || 0);
    
    // 가격 변화에 따른 색상 계산
    const candleColors = sortedData.map((candle, index, arr) => {
      if (index === 0) return darkThemeColors.priceUp;
      const prevCandle = arr[index - 1];
      const currentPrice = candle.trade_price || candle.closing_price || 0;
      const prevPrice = prevCandle.trade_price || prevCandle.closing_price || 0;
      return currentPrice >= prevPrice
        ? darkThemeColors.priceUp // 상승
        : darkThemeColors.priceDown; // 하락
    });
    
    // 트레이딩뷰 스타일 데이터셋 구성
    const datasets: (LineDataset | BarDataset)[] = [
      {
        label: '가격',
        data: prices,
        borderColor: '#5283ff',
        backgroundColor: 'rgba(82, 131, 255, 0.1)',
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: 'y',
        order: 0
      }
    ];
    
    // 이동평균선 추가
    if (indicators.includes('ma')) {
      const { ma7, ma14, ma30, ma60, ma90, ma120 } = calculateMAs(prices);
      
      datasets.push(
        {
          label: 'MA7',
          data: ma7,
          borderColor: darkThemeColors.ma7,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y',
          order: 0
        },
        {
          label: 'MA14',
          data: ma14,
          borderColor: darkThemeColors.ma14,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y',
          order: 0
        },
        {
          label: 'MA30',
          data: ma30,
          borderColor: darkThemeColors.ma30,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y',
          order: 0
        },
        {
          label: 'MA60',
          data: ma60,
          borderColor: darkThemeColors.ma60,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y',
          order: 0
        },
        {
          label: 'MA120',
          data: ma120,
          borderColor: darkThemeColors.ma120,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y',
          order: 0
        }
      );
    }
    
    // 거래량 추가
    if (indicators.includes('volume')) {
      const volumeColors = sortedData.map((candle, index, arr) => {
        if (index === 0) return darkThemeColors.volumeUp;
        const prevCandle = arr[index - 1];
        const currentPrice = candle.trade_price || candle.closing_price || 0;
        const prevPrice = prevCandle.trade_price || prevCandle.closing_price || 0;
        return currentPrice >= prevPrice
          ? darkThemeColors.volumeUp // 상승
          : darkThemeColors.volumeDown; // 하락
      });
      
      datasets.push({
        label: '거래량',
        data: volumes,
        backgroundColor: volumeColors,
        borderColor: 'transparent',
        borderWidth: 0,
        yAxisID: 'volume',
        order: 1
      });
    }
    
    // MACD 추가
    if (indicators.includes('macd')) {
      const { macd, signal, histogram } = calculateMACD(prices, 12, 26, 9);
      
      datasets.push(
        {
          label: 'MACD',
          data: macd,
          borderColor: darkThemeColors.macd,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'macd',
          order: 2
        },
        {
          label: 'Signal',
          data: signal,
          borderColor: darkThemeColors.signal,
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'macd',
          order: 2
        }
      );
      
      // 히스토그램을 막대 그래프로 추가
      const histogramColors = histogram.map(value => 
        value >= 0 ? darkThemeColors.priceUp : darkThemeColors.priceDown
      );
      
      datasets.push({
        label: 'Histogram',
        data: histogram,
        backgroundColor: histogramColors,
        borderColor: 'transparent',
        borderWidth: 0,
        yAxisID: 'macd',
        order: 3
      });
    }
    
    // RSI 추가
    if (indicators.includes('rsi')) {
      const rsiValues = calculateRSI(prices, 14);
      
      datasets.push({
        label: 'RSI',
        data: rsiValues,
        borderColor: darkThemeColors.rsi,
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'rsi',
        order: 4
      });
    }
    
    return { labels, datasets };
  };

  // 트레이딩뷰 스타일 차트 옵션
  const getTradingViewChartOptions = () => {
    // 표시할 축 구성
    const scales: any = {
      x: {
        ticks: {
          maxRotation: 0,
          color: darkThemeColors.text,
          autoSkip: true,
          maxTicksLimit: 12 // 더 많은 x축 레이블 표시
        },
        grid: {
          color: darkThemeColors.gridLines,
          display: true
        }
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
    };
    
    // 거래량 축 추가
    if (indicators.includes('volume')) {
      scales.volume = {
        position: 'left' as const,
        ticks: {
          color: darkThemeColors.text
        },
        grid: {
          color: 'transparent',
          display: false
        },
        display: true,
        // 전체 높이의 비율 조정 (더 크게)
        weight: 0.15
      };
    }
    
    // MACD 축 추가
    if (indicators.includes('macd')) {
      scales.macd = {
        position: 'left' as const,
        ticks: {
          color: darkThemeColors.text
        },
        grid: {
          color: darkThemeColors.gridLines,
          display: true
        },
        display: true,
        // 전체 높이의 비율 조정 (더 크게)
        weight: 0.15
      };
    }
    
    // RSI 축 추가
    if (indicators.includes('rsi')) {
      scales.rsi = {
        position: 'left' as const,
        ticks: {
          color: darkThemeColors.text,
          // RSI 값의 범위는 0-100
          min: 0,
          max: 100,
          stepSize: 20 // 0, 20, 40, 60, 80, 100 표시
        },
        grid: {
          color: darkThemeColors.gridLines,
          display: true
        },
        display: true,
        // 전체 높이의 비율 조정 (더 크게)
        weight: 0.15
      };
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // 애니메이션 비활성화로 성능 향상
      },
      // 차트 비율 최적화
      aspectRatio: 2, // 너비:높이 비율 조정
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20
        }
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: darkThemeColors.text,
            boxWidth: 12,
            padding: 10
          }
        },
        title: {
          display: true,
          text: `${symbol} - ${timeFrame}`,
          color: darkThemeColors.text,
          font: {
            size: 16
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          intersect: false,
          backgroundColor: darkThemeColors.background,
          titleColor: darkThemeColors.text,
          bodyColor: darkThemeColors.text,
          borderColor: darkThemeColors.gridLines,
          borderWidth: 1
        }
      },
      scales
    };
  };

  // 차트 렌더링
  const renderChart = () => {
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
      console.log('트레이딩뷰 스타일 차트 렌더링 시작...');
      
      // 트레이딩뷰 스타일 차트
      // Chart.js는 여러 차트 타입을 혼합할 수 없어서 Line 차트로 통일하고 스타일링으로 구분
      const chartData = getTradingViewChartData();
      const chartOptions = getTradingViewChartOptions();
      
      console.log('트레이딩뷰 스타일 차트 렌더링 완료');
      return <Line data={chartData} options={chartOptions} />;
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
    <div className="space-y-4">
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
      
      <div 
        ref={chartContainerRef}
        className="w-full bg-[#1e222d] p-4 rounded-lg transition-all duration-300 ease-in-out"
        style={{ height: `${chartHeight}px` }}
      >
        {renderChart()}
      </div>
    </div>
  );
}
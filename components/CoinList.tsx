'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { createChart, ColorType } from 'lightweight-charts';

interface Coin {
  id: number;
  symbol: string;
  market: string;
  korean_name: string;
  english_name: string;
  is_favorite: boolean;
  current_price?: number;
  change_rate?: number;
}

interface CoinListProps {
  initialCoins?: Coin[];
  favoritesOnly?: boolean;
}

// 기술적 지표 계산 함수들
const calculateSMA = (data: any[], period: number) => {
  const result = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((total, value) => total + value.close, 0);
    result.push({
      time: data[i].time,
      value: sum / period
    });
  }
  
  return result;
};

const calculateRSI = (data: any[], period: number = 14) => {
  const result = [];
  const changes = [];
  
  // 가격 변화 계산
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i-1].close);
  }
  
  // 첫 번째 평균 이득/손실 계산
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // 첫 번째 RSI 계산
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // 0으로 나누기 방지
  let rsi = 100 - (100 / (1 + rs));
  
  result.push({
    time: data[period].time,
    value: rsi
  });
  
  // 나머지 기간에 대한 RSI 계산
  for (let i = period + 1; i < data.length; i++) {
    const change = changes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi = 100 - (100 / (1 + rs));
    
    result.push({
      time: data[i].time,
      value: rsi
    });
  }
  
  return result;
};

const calculateMACD = (data: any[], shortPeriod: number = 12, longPeriod: number = 26, signalPeriod: number = 9) => {
  // EMA 계산 함수
  const calculateEMA = (data: any[], period: number) => {
    const k = 2 / (period + 1);
    const result = [{ time: data[0].time, value: data[0].close }];
    
    for (let i = 1; i < data.length; i++) {
      result.push({
        time: data[i].time,
        value: data[i].close * k + result[i-1].value * (1 - k)
      });
    }
    
    return result;
  };
  
  // 단기 및 장기 EMA 계산
  const shortEMA = calculateEMA(data, shortPeriod);
  const longEMA = calculateEMA(data, longPeriod);
  
  // MACD 선 계산 (단기 EMA - 장기 EMA)
  const macdLine = [];
  const signalLineData = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i >= longPeriod - 1) {
      macdLine.push({
        time: data[i].time,
        value: shortEMA[i].value - longEMA[i].value
      });
    }
  }
  
  // 시그널 라인 계산 (MACD의 9일 EMA)
  if (macdLine.length >= signalPeriod) {
    let signalSum = 0;
    for (let i = 0; i < signalPeriod; i++) {
      signalSum += macdLine[i].value;
    }
    
    let signalValue = signalSum / signalPeriod;
    signalLineData.push({
      time: macdLine[signalPeriod - 1].time,
      value: signalValue
    });
    
    const k = 2 / (signalPeriod + 1);
    for (let i = signalPeriod; i < macdLine.length; i++) {
      signalValue = macdLine[i].value * k + signalValue * (1 - k);
      signalLineData.push({
        time: macdLine[i].time,
        value: signalValue
      });
    }
  }
  
  // 히스토그램 계산 (MACD 선 - 시그널 선)
  const histogram = [];
  const minSignalIndex = macdLine.length - signalLineData.length;
  
  for (let i = 0; i < signalLineData.length; i++) {
    histogram.push({
      time: signalLineData[i].time,
      value: macdLine[i + minSignalIndex].value - signalLineData[i].value
    });
  }
  
  return {
    macdLine: macdLine.slice(signalPeriod - 1),
    signalLine: signalLineData,
    histogram: histogram
  };
};

export default function CoinList({ initialCoins = [], favoritesOnly = false }: CoinListProps) {
  const [coins, setCoins] = useState<Coin[]>(initialCoins);
  const [favoriteCoins, setFavoriteCoins] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(initialCoins.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  
  // 바이낸스 API에서 코인 데이터 가져오기
  const fetchCoins = async () => {
    try {
      setLoading(true);
      console.log('코인 목록을 불러오는 중...');
      
      // BTCUSDT만 표시하도록 수정
      const processedCoins = [{
        id: 1,
        symbol: 'BTCUSDT',
        market: 'Binance',
        korean_name: '비트코인',
        english_name: 'Bitcoin',
        is_favorite: false, // 초기에 즐겨찾기가 없도록 설정
        current_price: 0,
        change_rate: 0
      }];

      setCoins(processedCoins);
      setError(null);
      
      // 선택된 코인 설정
      setSelectedSymbol('BTCUSDT');
      
      // 가격 정보 즉시 가져오기
      fetchPrices(processedCoins);
      
    } catch (err) {
      setError((err as Error).message);
      console.error('코인 목록 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  // 가격 정보 가져오기
  const fetchPrices = async (coinList: Coin[] = coins) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`);
      const priceData = await response.json();
      
      setCoins(prevCoins => {
        return prevCoins.map(coin => {
          if (coin.symbol === 'BTCUSDT') {
            return {
              ...coin,
              current_price: parseFloat(priceData.lastPrice),
              change_rate: parseFloat(priceData.priceChangePercent) / 100,
            };
          }
          return coin;
        });
      });
    } catch (err) {
      console.error('가격 정보 조회 에러:', err);
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = (symbol: string) => {
    setCoins(prevCoins => {
      return prevCoins.map(coin => {
        if (coin.symbol === symbol) {
          const newFavoriteStatus = !coin.is_favorite;
          
          // 즐겨찾기 목록 업데이트
          if (newFavoriteStatus) {
            setFavoriteCoins(prev => [...prev, symbol]);
          } else {
            setFavoriteCoins(prev => prev.filter(s => s !== symbol));
          }
          
          return {
            ...coin,
            is_favorite: newFavoriteStatus
          };
        }
        return coin;
      });
    });
  };

  // 코인 차트 렌더링
  const renderChart = async (symbol: string = 'BTCUSDT') => {
    if (chartRef.current) {
      // 기존 차트 초기화
      chartRef.current.innerHTML = '';
      setSelectedSymbol(symbol);

      // 여러 차트를 위한 컨테이너 생성
      const mainChartDiv = document.createElement('div');
      mainChartDiv.style.height = '350px';
      mainChartDiv.style.width = '100%';
      chartRef.current.appendChild(mainChartDiv);

      const macdDiv = document.createElement('div');
      macdDiv.style.height = '150px';
      macdDiv.style.width = '100%';
      macdDiv.style.marginTop = '10px';
      chartRef.current.appendChild(macdDiv);

      const rsiDiv = document.createElement('div');
      rsiDiv.style.height = '150px';
      rsiDiv.style.width = '100%';
      rsiDiv.style.marginTop = '10px';
      chartRef.current.appendChild(rsiDiv);

      // 캔들 차트 생성
      const mainChart = createChart(mainChartDiv, {
        width: mainChartDiv.clientWidth,
        height: mainChartDiv.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        }
      });

      // MACD 차트 생성
      const macdChart = createChart(macdDiv, {
        width: macdDiv.clientWidth,
        height: macdDiv.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
      });

      // RSI 차트 생성
      const rsiChart = createChart(rsiDiv, {
        width: rsiDiv.clientWidth,
        height: rsiDiv.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
      });

      // 캔들 데이터 가져오기
      try {
        // 과거 데이터를 가능한 한 많이 가져오는 함수
        const fetchHistoricalData = async (limit: number = 1000, endTime?: string) => {
          let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${limit}`;
          if (endTime) {
            url += `&endTime=${endTime}`;
          }
          const response = await fetch(url);
          return await response.json();
        };
        
        // 초기 데이터 가져오기
        const initialData = await fetchHistoricalData();
        let allData = [...initialData];
        
        // 더 많은 과거 데이터 가져오기
        if (initialData.length > 0) {
          let oldestTime = parseInt(initialData[0][0]);
          
          for (let i = 0; i < 3; i++) {
            const moreData = await fetchHistoricalData(1000, oldestTime.toString());
            if (moreData.length > 0) {
              allData = [...moreData, ...allData];
              oldestTime = parseInt(moreData[0][0]);
            } else {
              break;
            }
          }
        }
        
        // 데이터 포맷팅
        const formattedData = allData.map((candle: any) => ({
          time: parseInt(candle[0]) / 1000,
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }));

        // 캔들 시리즈 추가
        const candleSeries = mainChart.addCandlestickSeries({
          upColor: 'red',
          downColor: 'blue',
          borderVisible: false,
          wickUpColor: 'red',
          wickDownColor: 'blue',
        });
        candleSeries.setData(formattedData);
        
        // MA 계산 및 표시
        const sma20Data = calculateSMA(formattedData, 20);
        const sma50Data = calculateSMA(formattedData, 50);
        
        const ma20Series = mainChart.addLineSeries({
          color: 'rgba(255, 140, 0, 1)',
          lineWidth: 2,
          title: 'MA20',
        });
        
        const ma50Series = mainChart.addLineSeries({
          color: 'rgba(30, 144, 255, 1)',
          lineWidth: 2,
          title: 'MA50',
        });
        
        ma20Series.setData(sma20Data);
        ma50Series.setData(sma50Data);
        
        // MACD 계산 및 표시
        const macdResult = calculateMACD(formattedData);
        
        const macdLineSeries = macdChart.addLineSeries({
          color: 'rgba(30, 144, 255, 1)',
          lineWidth: 2,
          title: 'MACD Line',
        });
        
        const signalLineSeries = macdChart.addLineSeries({
          color: 'rgba(255, 70, 70, 1)',
          lineWidth: 2,
          title: 'Signal Line',
        });
        
        // 히스토그램 추가 - v4.1.1에 맞게 간소화
        const histogramSeries = macdChart.addHistogramSeries({
          color: '#26a69a',
        });
        
        macdLineSeries.setData(macdResult.macdLine);
        signalLineSeries.setData(macdResult.signalLine);
        histogramSeries.setData(macdResult.histogram);
        
        // RSI 계산 및 표시
        const rsiData = calculateRSI(formattedData);
        
        const rsiSeries = rsiChart.addLineSeries({
          color: 'rgba(125, 75, 199, 1)',
          lineWidth: 2,
          title: 'RSI(14)',
        });
        
        // 70과 30 수준선 추가
        const rsi70Series = rsiChart.addLineSeries({
          color: 'rgba(255, 0, 0, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
        });
        
        const rsi30Series = rsiChart.addLineSeries({
          color: 'rgba(0, 128, 0, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
        });
        
        // 수평선 데이터 생성
        const horizontalLines70 = rsiData.map(item => ({
          time: item.time,
          value: 70,
        }));
        
        const horizontalLines30 = rsiData.map(item => ({
          time: item.time,
          value: 30,
        }));
        
        rsiSeries.setData(rsiData);
        rsi70Series.setData(horizontalLines70);
        rsi30Series.setData(horizontalLines30);
        
        // 심볼 텍스트 추가
        const symbolLabel = document.createElement('div');
        symbolLabel.style.position = 'absolute';
        symbolLabel.style.top = '10px';
        symbolLabel.style.left = '50%';
        symbolLabel.style.transform = 'translateX(-50%)';
        symbolLabel.style.fontSize = '24px';
        symbolLabel.style.color = 'rgba(0, 0, 0, 0.2)';
        symbolLabel.style.fontWeight = 'bold';
        symbolLabel.textContent = symbol;
        mainChartDiv.style.position = 'relative';
        mainChartDiv.appendChild(symbolLabel);
        
        // 차트 영역 맞추기
        mainChart.timeScale().fitContent();
        macdChart.timeScale().fitContent();
        rsiChart.timeScale().fitContent();
        
        // 차트 동기화 - Lightweight Charts v4.1.1 방식으로 구현
        mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (range) {
            macdChart.timeScale().setVisibleLogicalRange(range);
            rsiChart.timeScale().setVisibleLogicalRange(range);
          }
        });
        
        macdChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (range) {
            mainChart.timeScale().setVisibleLogicalRange(range);
            rsiChart.timeScale().setVisibleLogicalRange(range);
          }
        });
        
        rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (range) {
            mainChart.timeScale().setVisibleLogicalRange(range);
            macdChart.timeScale().setVisibleLogicalRange(range);
          }
        });
        
      } catch (error) {
        console.error('차트 데이터 로딩 에러:', error);
      }
    }
  };

  // 최초 마운트 시 코인 목록 가져오기
  useEffect(() => {
    if (initialCoins.length === 0) {
      fetchCoins();
    }
    
    // 가격 정보 주기적 업데이트
    const intervalId = setInterval(() => fetchPrices(), 30000); // 30초마다 가격 정보 업데이트
    
    return () => clearInterval(intervalId);
  }, [initialCoins.length]);

  // 차트 렌더링
  useEffect(() => {
    // 첫 마운트시 차트 렌더링 (BTCUSDT)
    if (chartRef.current && selectedSymbol) {
      renderChart(selectedSymbol);
    }
    
    // 창 크기 변경 시 차트 리사이징
    const handleResize = () => {
      if (selectedSymbol) {
        renderChart(selectedSymbol);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartRef.current]);

  // 코인 추가 함수
  const addCoin = () => {
    // 팝업 창을 통해 추가할 코인의 심볼을 입력받음
    const symbol = prompt('추가할 코인 심볼을 입력하세요 (예: ETHUSDT):');
    if (!symbol) return;
    
    // 대문자로 변환 및 공백 제거
    const formattedSymbol = symbol.toUpperCase().trim();
    
    // 이미 목록에 있는지 확인
    if (coins.some(coin => coin.symbol === formattedSymbol)) {
      alert('이미 추가된 코인입니다.');
      return;
    }
    
    // 코인 추가
    const newCoin: Coin = {
      id: Math.random(),
      symbol: formattedSymbol,
      market: 'Binance',
      korean_name: formattedSymbol, // 실제로는 한글 이름을 가져오는 API가 필요할 수 있음
      english_name: formattedSymbol,
      is_favorite: false,
      current_price: 0,
      change_rate: 0
    };
    
    setCoins(prev => [...prev, newCoin]);
    
    // 새로 추가된 코인의 가격 정보 가져오기
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${formattedSymbol}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('존재하지 않는 코인 심볼입니다.');
        }
        return response.json();
      })
      .then(data => {
        setCoins(prev => prev.map(coin => {
          if (coin.symbol === formattedSymbol) {
            return {
              ...coin,
              current_price: parseFloat(data.lastPrice),
              change_rate: parseFloat(data.priceChangePercent) / 100,
            };
          }
          return coin;
        }));
      })
      .catch(err => {
        // 유효하지 않은 심볼이면 목록에서 제거
        alert(err.message);
        setCoins(prev => prev.filter(coin => coin.symbol !== formattedSymbol));
      });
  };

  // 필터링된 코인 목록
  const filteredCoins = coins.filter(
    coin => {
      // 즐겨찾기 필터
      if (favoritesOnly && !coin.is_favorite) {
        return false;
      }
      
      // 검색어 필터
      return coin.symbol.toLowerCase().includes(filter.toLowerCase()) ||
            coin.korean_name.toLowerCase().includes(filter.toLowerCase()) ||
            coin.english_name.toLowerCase().includes(filter.toLowerCase());
    }
  );

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="text-red-700">
            <p>{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={fetchCoins}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-bold">
          {favoritesOnly ? '즐겨찾기 코인' : '코인 목록'}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="코인 검색..."
            className="px-3 py-2 border rounded-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button variant="outline" onClick={fetchCoins}>
            새로고침
          </Button>
          <Button onClick={addCoin}>
            코인 추가
          </Button>
        </div>
      </div>

      {filteredCoins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {filter ? `"${filter}"에 대한 검색 결과가 없습니다.` : '코인이 없습니다.'}
          </p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    즐겨찾기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    심볼
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변동률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마켓
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoins.map((coin) => (
                  <tr key={coin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => toggleFavorite(coin.symbol)}>
                        {coin.is_favorite ? (
                          <Star className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <StarOff className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => renderChart(coin.symbol)}>
                        {coin.korean_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{coin.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coin.current_price ? formatNumber(coin.current_price) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coin.change_rate !== undefined ? (
                        <span
                          className={`${
                            coin.change_rate > 0
                              ? 'text-green-600'
                              : coin.change_rate < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {(coin.change_rate * 100).toFixed(2)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{coin.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 space-y-2">
            <h3 className="text-xl font-bold">{selectedSymbol} 차트</h3>
            <p className="text-sm text-gray-500">MA(20, 50), MACD, RSI 지표가 포함되어 있습니다.</p>
            <div ref={chartRef} className="w-full h-[700px] border rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
}

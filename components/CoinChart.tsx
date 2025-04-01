'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  CandlestickData, 
  UTCTimestamp, 
  LineData,
  LineStyle,
  CrosshairMode
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react'; // Removed unused imports

// Define the structure for the fetched candle data (match your API/mock data)
interface ApiCandleData {
  timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number; // Assuming this is volume
}

// Define the structure required by Lightweight Charts Candlestick Series
type ChartCandleData = CandlestickData<UTCTimestamp>;

// Define the structure required by Lightweight Charts Line Series
type ChartLineData = LineData<UTCTimestamp>;

interface CoinChartProps {
  symbol: string;
}

const TIMEFRAMES = ['1m', '15m', '1h', '4h', '1d', '1w', '1M'] as const; // Adjusted '1s' to '1m' as it's more common
type TimeFrame = typeof TIMEFRAMES[number];

// Theme definition (as provided)
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
  volume: '#5d6683', // Added for potential volume series
  volumeUp: '#26a69a', // Added for potential volume series
  volumeDown: '#ef5350', // Added for potential volume series
};

export default function CoinChart({ symbol }: CoinChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('4h');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(500); // Initial height
  const [data, setData] = useState<ApiCandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null); // Ref for ResizeObserver

  // --- Data Fetching ---
  const fetchCandleData = useCallback(async (currentSymbol: string, currentFrame: TimeFrame) => {
    setLoading(true);
    setError(null);
    console.log(`Fetching data for ${currentSymbol} with timeframe ${currentFrame}...`); // Log fetching action

    try {
      // TODO: Replace mock data with actual API call
      // Example API call structure:
      // const response = await fetch(`/api/candles?symbol=${currentSymbol}&timeframe=${currentFrame}`);
      // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      // const fetchedData: ApiCandleData[] = await response.json();
      
      // Using Mock Data for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      const mockData: ApiCandleData[] = [
         // Add more realistic data points for better testing
         { timestamp: 1711670400000, opening_price: 83000, high_price: 83500, low_price: 82800, trade_price: 83420.42, candle_acc_trade_volume: 400000 },
         { timestamp: 1711756800000, opening_price: 83420.42, high_price: 83700, low_price: 83100, trade_price: 83600.00, candle_acc_trade_volume: 450000 },
         { timestamp: 1711843200000, opening_price: 83600.00, high_price: 83650.36, low_price: 83200.50, trade_price: 83456.50, candle_acc_trade_volume: 429298 },
         { timestamp: 1711929600000, opening_price: 83456.50, high_price: 83900.00, low_price: 83300.00, trade_price: 83800.00, candle_acc_trade_volume: 512345 },
         { timestamp: 1712016000000, opening_price: 83800.00, high_price: 84100.00, low_price: 83600.00, trade_price: 83900.00, candle_acc_trade_volume: 398765 },
         { timestamp: 1712102400000, opening_price: 83900.00, high_price: 84500.00, low_price: 83800.00, trade_price: 84400.00, candle_acc_trade_volume: 550000 },
         { timestamp: 1712188800000, opening_price: 84400.00, high_price: 84600.00, low_price: 84000.00, trade_price: 84100.00, candle_acc_trade_volume: 480000 },
      ].sort((a, b) => a.timestamp - b.timestamp); // Ensure data is sorted by time

      setData(mockData);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error('Chart data fetching error:', err);
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, function is self-contained or uses props passed directly

  // --- Chart Removal ---
  const removeChart = useCallback(() => {
    if (resizeObserverRef.current && chartContainerRef.current) {
        resizeObserverRef.current.unobserve(chartContainerRef.current);
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
    }
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.error('Error removing chart:', error);
      }
      chartRef.current = null;
    }
    // Clear container content just in case
    if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
    }
  }, []); // Empty dependency array is correct here

  // --- Moving Average Calculation ---
  const calculateMA = (data: number[], period: number): (number | undefined)[] => {
    if (period <= 0) return Array(data.length).fill(undefined);
    const result: (number | undefined)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(undefined); // Use undefined for periods without enough data
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  // --- Effect for Fetching Data ---
  useEffect(() => {
    fetchCandleData(symbol, timeFrame);
  }, [symbol, timeFrame, fetchCandleData]); // Include fetchCandleData in dependencies

  // --- Effect for Chart Creation and Updates ---
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0 || loading) {
      // If loading or no data, ensure previous chart is removed
      if (chartRef.current) {
        removeChart();
      }
      return; // Exit if container not ready, data is empty, or still loading
    }

    // Ensure cleanup runs before creating a new chart if dependencies change
    removeChart(); 

    const chartElement = chartContainerRef.current;
    const chart = createChart(chartElement, {
      width: chartElement.clientWidth,
      height: chartHeight, // Use state for height
      layout: {
        background: { type: ColorType.Solid, color: darkTheme.background },
        textColor: darkTheme.text,
      },
      grid: {
        vertLines: { color: darkTheme.gridLines, style: LineStyle.SparseDotted },
        horzLines: { color: darkTheme.gridLines, style: LineStyle.SparseDotted },
      },
      rightPriceScale: {
        borderColor: darkTheme.gridLines,
      },
      timeScale: {
        borderColor: darkTheme.gridLines,
        timeVisible: true, // Ensure time is visible
        secondsVisible: timeFrame === '1m', // Show seconds only for minute timeframe potentially
      },
      crosshair: {
        mode: CrosshairMode.Normal, // Standard crosshair behavior
      },
      // Improve panning and scaling behavior
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart; // Store chart instance

    // --- Candlestick Series ---
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: darkTheme.priceUp,
      downColor: darkTheme.priceDown,
      borderVisible: false,
      wickUpColor: darkTheme.priceUp,
      wickDownColor: darkTheme.priceDown,
    });

    const formattedCandleData: ChartCandleData[] = data.map(candle => ({
      time: (candle.timestamp / 1000) as UTCTimestamp, // Convert ms to seconds (UTCTimestamp)
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
    }));

    candlestickSeries.setData(formattedCandleData);

    // --- Moving Average Series ---
    const prices = data.map(d => d.trade_price);
    const timestamps = data.map(d => (d.timestamp / 1000) as UTCTimestamp);

    const maConfigs = [
      { period: 7, color: darkTheme.ma7 },
      { period: 14, color: darkTheme.ma14 },
      { period: 30, color: darkTheme.ma30 },
      { period: 60, color: darkTheme.ma60 },
      // { period: 90, color: darkTheme.ma90 }, // Can add more if needed
      // { period: 120, color: darkTheme.ma120 }
    ];

    maConfigs.forEach(({ period, color }) => {
      const maValues = calculateMA(prices, period);
      const maData: ChartLineData[] = maValues
        .map((value, index) => ({
          time: timestamps[index],
          value: value, // Keep undefined values
        }))
        .filter(item => item.value !== undefined); // Filter out undefined before setting data

      if (maData.length > 0) {
         const maSeries = chart.addLineSeries({
           color: color,
           lineWidth: 1, // Use thinner lines for MAs
           lastValueVisible: false, // Hide MA value in price scale
           priceLineVisible: false, // Hide MA price line
         });
         maSeries.setData(maData);
      }
    });

    chart.timeScale().fitContent(); // Fit chart to content initially

    // --- Resize Handling ---
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartHeight, // Re-apply height state on resize
        });
      }
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(chartElement);

    // --- Fullscreen Change Listener ---
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      // Adjust height automatically on fullscreen change, or refit chart
      setTimeout(() => { // Timeout to allow DOM changes
         if (document.fullscreenElement) {
             // Optionally maximize height in fullscreen
             // setChartHeight(window.innerHeight * 0.9); // Example: 90% of viewport height
         } else {
             // Restore original height? Or keep current height state
             // setChartHeight(500); // Reset to default if needed
         }
         handleResize(); // Trigger resize logic after state update
      }, 100);

    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);


    // --- Cleanup Function ---
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      removeChart(); // Use the memoized removeChart function
    };
    // Dependencies: data, loading, chartHeight, symbol, timeFrame, removeChart
    // symbol & timeFrame are included because data depends on them, ensuring re-render if they change AND data is fetched.
    // removeChart is included as it's used in the effect.
  }, [data, loading, chartHeight, symbol, timeFrame, removeChart]); 


  // --- UI Event Handlers ---
  const toggleFullScreen = useCallback(() => {
    if (!chartContainerRef.current) return;
    if (!document.fullscreenElement) {
      chartContainerRef.current.requestFullscreen()
        .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []); // Empty dependencies: relies on refs and document state

  const handleTimeFrameChange = (frame: TimeFrame) => {
      setTimeFrame(frame);
      // Data fetching is handled by the useEffect watching `timeFrame`
  }

  const handleRefresh = () => {
      fetchCandleData(symbol, timeFrame); // Manually trigger data refresh
  }

  // --- Render Logic ---
  return (
    <div
      className="space-y-4 p-4 rounded-lg"
      style={{
        backgroundColor: darkTheme.background,
        color: darkTheme.text
      }}
    >
      {/* Controls Header */}
      <div className="flex flex-wrap justify-between items-center gap-y-2 mb-2">
        {/* Timeframe Selection */}
        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map((frame) => (
            <Button
              key={frame}
              variant={timeFrame === frame ? 'secondary' : 'outline'} // Use secondary for active
              size="sm"
              onClick={() => handleTimeFrameChange(frame)}
              className={`border-gray-600 hover:bg-gray-700 ${timeFrame === frame ? 'text-white bg-gray-600' : 'text-gray-400 hover:text-white'}`}
            >
              {frame}
            </Button>
          ))}
        </div>

        {/* Chart Tools */}
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="icon" // Use icon size for single icon buttons
            onClick={handleRefresh}
            title="Refresh Data"
            className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
           <Button
            variant="outline"
            size="icon"
            onClick={() => setChartHeight(h => Math.max(300, h - 100))} // Set min height
            title="Decrease Chart Height"
            className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setChartHeight(h => Math.min(1200, h + 100))} // Set max height
            title="Increase Chart Height"
            className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Chart Container Area */}
      <div
        className="w-full bg-[#1e222d] rounded-lg overflow-hidden" // Use overflow-hidden
        style={{ height: `${chartHeight}px`, position: 'relative' }} // Added position relative for absolute spinner
      >
        {loading && ( // Show loader overlay
          <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-gray-800 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && !loading && ( // Show error only if not loading
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-4">
            <p className="text-red-500 font-semibold">Error loading chart data:</p>
            <p className="text-red-400 text-sm">{error}</p>
            <Button onClick={handleRefresh} variant="destructive" size="sm">
              Retry
            </Button>
          </div>
        )}
         {/* Chart rendering target - ensure it's present even when loading/error to attach ref */}
         <div ref={chartContainerRef} className={`w-full h-full ${loading || error ? 'opacity-0' : 'opacity-100'}`} />
         {/* Render placeholder if no data and not loading/error */}
         {!loading && !error && data.length === 0 && (
            <div className="absolute inset-0 flex justify-center items-center text-gray-500">
                No data available for {symbol} ({timeFrame}).
            </div>
         )}
      </div>
    </div>
  );
}

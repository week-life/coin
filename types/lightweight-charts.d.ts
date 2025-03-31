// 추가적인 타입 정의
declare module 'lightweight-charts' {
  export interface IChartApi {
    destroy(): void;
    remove?(): void;
    addCandlestickSeries(options?: CandlestickSeriesOptions): ISeriesApi<CandlestickData>;
    addLineSeries(options?: LineSeriesOptions): ISeriesApi<LineData>;
    addHistogramSeries(options?: HistogramSeriesOptions): ISeriesApi<HistogramData>;
    priceScale(id: string): IPriceScaleApi;
  }

  export interface IPriceScaleApi {
    applyOptions(options: PriceScaleOptions): void;
  }

  export interface PriceScaleOptions {
    scaleMargins?: {
      top?: number;
      bottom?: number;
    };
  }

  export interface ISeriesApi<T> {
    setData(data: T[]): void;
  }

  export interface LineSeriesOptions {
    color?: string;
    lineWidth?: number;
    priceScaleId?: string;
    title?: string;
  }

  export interface LineData {
    time: number;
    value: number;
  }

  export interface HistogramSeriesOptions {
    color?: string;
    priceFormat?: {
      type: 'volume' | 'price';
    };
    priceScaleId?: string;
  }

  export interface HistogramData {
    time: number;
    value: number;
    color?: string;
  }

  export function createChart(
    container: HTMLElement, 
    options?: {
      width?: number;
      height?: number;
      layout?: {
        background?: { type: ColorType, color: string };
        textColor?: string;
      };
      grid?: {
        vertLines?: { color: string };
        horzLines?: { color: string };
      };
      crosshair?: {
        mode?: number;
      };
      rightPriceScale?: {
        borderColor?: string;
      };
      timeScale?: {
        borderColor?: string;
      };
    }
  ): IChartApi;

  export enum ColorType {
    Solid = 'solid'
  }

  export interface CandlestickSeriesOptions {
    upColor?: string;
    downColor?: string;
    borderVisible?: boolean;
    wickUpColor?: string;
    wickDownColor?: string;
  }

  export interface CandlestickData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }
}

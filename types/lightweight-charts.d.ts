declare module 'lightweight-charts' {
  export interface ChartOptions {
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

  export class IChartApi {
    addCandlestickSeries(options?: CandlestickSeriesOptions): ICandlestickSeries;
  }

  export interface ICandlestickSeries {
    setData(data: CandlestickData[]): void;
  }

  export function createChart(container: HTMLElement, options?: ChartOptions): IChartApi;
}

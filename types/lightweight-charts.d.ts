// 추가적인 타입 정의
declare module 'lightweight-charts' {
  export interface IChartApi {
    destroy(): void;
    remove?(): void;
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

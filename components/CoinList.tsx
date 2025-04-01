'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';

// ... (rest of the code remains the same until renderChart function)

// 차트 렌더링 함수 내부에서 수정
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
    const mainChart: IChartApi = createChart(mainChartDiv, {
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
    const macdChart: IChartApi = createChart(macdDiv, {
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
    const rsiChart: IChartApi = createChart(rsiDiv, {
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

    // 기존 차트 생성 및 데이터 추가 로직 유지...

    // 차트 영역 맞추기 - 최신 버전 방식으로 수정
    const applyTimeScaleOptions = () => {
      mainChart.applyOptions({
        timeScale: {
          rightOffset: 10,
          fixLeftEdge: true,
          fixRightEdge: true,
        }
      });
      macdChart.applyOptions({
        timeScale: {
          rightOffset: 10,
          fixLeftEdge: true,
          fixRightEdge: true,
        }
      });
      rsiChart.applyOptions({
        timeScale: {
          rightOffset: 10,
          fixLeftEdge: true,
          fixRightEdge: true,
        }
      });

      mainChart.timeScale().fitContent();
      macdChart.timeScale().fitContent();
      rsiChart.timeScale().fitContent();
    };

    // 차트 동기화 - 최신 버전 방식으로 구현
    const synchronizeCharts = () => {
      const mainChartTimeScaleListener = (range: any) => {
        if (range) {
          macdChart.timeScale().setVisibleLogicalRange(range);
          rsiChart.timeScale().setVisibleLogicalRange(range);
        }
      };

      const macdChartTimeScaleListener = (range: any) => {
        if (range) {
          mainChart.timeScale().setVisibleLogicalRange(range);
          rsiChart.timeScale().setVisibleLogicalRange(range);
        }
      };

      const rsiChartTimeScaleListener = (range: any) => {
        if (range) {
          mainChart.timeScale().setVisibleLogicalRange(range);
          macdChart.timeScale().setVisibleLogicalRange(range);
        }
      };

      mainChart.timeScale().subscribeVisibleLogicalRangeChange(mainChartTimeScaleListener);
      macdChart.timeScale().subscribeVisibleLogicalRangeChange(macdChartTimeScaleListener);
      rsiChart.timeScale().subscribeVisibleLogicalRangeChange(rsiChartTimeScaleListener);

      // 이벤트 리스너 제거를 위한 클린업 함수 반환
      return () => {
        mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(mainChartTimeScaleListener);
        macdChart.timeScale().unsubscribeVisibleLogicalRangeChange(macdChartTimeScaleListener);
        rsiChart.timeScale().unsubscribeVisibleLogicalRangeChange(rsiChartTimeScaleListener);
      };
    };

    // 타임 스케일 옵션 적용
    applyTimeScaleOptions();

    // 차트 동기화 설정
    const unsubscribe = synchronizeCharts();

    // 데이터 추가 및 기타 로직 계속...
    // (기존 코드 나머지 부분 유지)

    // 컴포넌트 언마운트 시 정리
    return () => {
      unsubscribe();
      mainChart.remove();
      macdChart.remove();
      rsiChart.remove();
    };
  }
};

// ... (나머지 코드 유지)

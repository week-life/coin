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
      const priceChartData = getPriceChartData();
      const priceChartOptions = getPriceChartOptions();
      
      // 차트 영역 렌더링
      return (
        <div className="flex flex-col w-full space-y-2">
          {/* 메인 가격 차트 영역 - 더 큰 높이 할당 */}
          <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.6)}px` }}>
            <Line data={priceChartData} options={priceChartOptions} />
          </div>
          
          {/* 거래량 차트 영역 */}
          {indicators.includes('volume') && (
            <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.13)}px` }}>
              <Bar data={getVolumeChartData()} options={getVolumeChartOptions()} />
            </div>
          )}
          
          {/* MACD 차트 영역 */}
          {indicators.includes('macd') && (
            <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.13)}px` }}>
              <Line data={getMACDChartData()} options={getMACDChartOptions()} />
            </div>
          )}
          
          {/* RSI 차트 영역 */}
          {indicators.includes('rsi') && (
            <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.13)}px` }}>
              <Line data={getRSIChartData()} options={getRSIChartOptions()} />
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
        {renderCharts()}
      </div>
    </div>
  );
}
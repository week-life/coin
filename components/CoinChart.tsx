      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            color: darkThemeColors.text,
            autoSkip: true,
            maxTicksLimit: 12
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
          mode: 'index'
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
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
          mode: 'index'
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
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
          mode: 'index'
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
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
    
    const handleDrag = () => {
      // 드래그 중에는 빈 함수
    };
    
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
      const priceChartData = getPriceChartData();
      const priceChartOptions = getPriceChartOptions();
      
      // 차트 영역 렌더링
      return (
        <div className="flex flex-col w-full space-y-2">
          {/* 메인 가격 차트 영역 - 더 큰 높이 할당 */}
          <div className="w-full" style={{ height: `${Math.floor(chartHeight * 0.6)}px` }}>
            <Line 
              data={priceChartData} 
              options={priceChartOptions}
              ref={(ref) => {
                if (ref) {
                  priceChartRef.current = ref.chartInstance;
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
                    volumeChartRef.current = ref.chartInstance;
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
                    macdChartRef.current = ref.chartInstance;
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
                    rsiChartRef.current = ref.chartInstance;
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
      
      <div className="p-2 bg-[#1e222d] rounded-md mb-2 text-white text-sm flex items-center">
        <MoveHorizontal className="h-4 w-4 mr-2" />
        마우스로 드래그하여 차트를 좌우로 이동하거나 휠을 사용하여 확대/축소할 수 있습니다.
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
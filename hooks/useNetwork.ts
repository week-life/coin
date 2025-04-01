import { useState, useEffect } from 'react';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const checkNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || 'unknown');
      }
    };

    // 초기 상태 설정
    checkNetworkStatus();

    // 네트워크 상태 변경 이벤트 리스너 추가
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', checkNetworkStatus);
    }

    // 클린업 함수
    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
      
      if (connection) {
        connection.removeEventListener('change', checkNetworkStatus);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isOffline: !isOnline
  };
}

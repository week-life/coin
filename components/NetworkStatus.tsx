'use client';

import React from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatus() {
  const { isOffline, connectionType } = useNetwork();

  if (!isOffline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-3 flex items-center justify-center"
      >
        <WifiOff className="mr-2" />
        <div>
          <span className="font-bold">오프라인 모드</span>
          <span className="ml-2 text-sm">
            네트워크 연결이 끊겼습니다. 
            {connectionType !== 'unknown' && `(연결 방식: ${connectionType})`}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

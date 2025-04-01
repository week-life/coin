'use client';

import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import NetworkStatus from '../NetworkStatus';
import ErrorBoundary from '../ErrorBoundary';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pb-16">
        <NetworkStatus />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Navbar />
      </div>
    </ErrorBoundary>
  );
}

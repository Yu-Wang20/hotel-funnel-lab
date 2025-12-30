import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTracking } from './TrackingContext';

type PriceMode = 'total' | 'net';

interface PriceModeContextType {
  priceMode: PriceMode;
  setPriceMode: (mode: PriceMode) => void;
  togglePriceMode: () => void;
  formatPrice: (basePrice: number, taxAmount: number, feeAmount: number, currency?: string) => {
    displayPrice: number;
    label: string;
    breakdown: { base: number; tax: number; fee: number; total: number };
  };
}

const PriceModeContext = createContext<PriceModeContextType | null>(null);

export function PriceModeProvider({ children }: { children: React.ReactNode }) {
  const [priceMode, setPriceModeState] = useState<PriceMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('hotel_price_mode') as PriceMode) || 'total';
    }
    return 'total';
  });

  const { trackEvent } = useTracking();

  const setPriceMode = useCallback((mode: PriceMode) => {
    setPriceModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_price_mode', mode);
    }
    trackEvent('price_toggle_change', { 
      final_state: mode,
      previous_state: priceMode 
    });
  }, [priceMode, trackEvent]);

  const togglePriceMode = useCallback(() => {
    setPriceMode(priceMode === 'total' ? 'net' : 'total');
  }, [priceMode, setPriceMode]);

  const formatPrice = useCallback((
    basePrice: number, 
    taxAmount: number, 
    feeAmount: number,
    currency: string = 'USD'
  ) => {
    const total = basePrice + taxAmount + feeAmount;
    const displayPrice = priceMode === 'total' ? total : basePrice;
    const label = priceMode === 'total' ? 'Total Price' : 'Base Price';
    
    return {
      displayPrice,
      label,
      breakdown: {
        base: basePrice,
        tax: taxAmount,
        fee: feeAmount,
        total,
      },
    };
  }, [priceMode]);

  return (
    <PriceModeContext.Provider value={{ priceMode, setPriceMode, togglePriceMode, formatPrice }}>
      {children}
    </PriceModeContext.Provider>
  );
}

export function usePriceMode() {
  const context = useContext(PriceModeContext);
  if (!context) {
    throw new Error('usePriceMode must be used within a PriceModeProvider');
  }
  return context;
}

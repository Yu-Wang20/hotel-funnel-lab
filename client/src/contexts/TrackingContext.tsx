import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { nanoid } from 'nanoid';

interface TrackingContextType {
  sessionId: string;
  variantId: string | null;
  experimentId: string | null;
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
  setExperiment: (experimentId: string, variantId: string) => void;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hotel_session_id');
      if (stored) return stored;
      const newId = nanoid(16);
      sessionStorage.setItem('hotel_session_id', newId);
      return newId;
    }
    return nanoid(16);
  });

  const [variantId, setVariantId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hotel_variant_id');
    }
    return null;
  });

  const [experimentId, setExperimentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hotel_experiment_id');
    }
    return null;
  });

  const trackMutation = trpc.tracking.track.useMutation();

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    
    trackMutation.mutate({
      eventName,
      sessionId,
      variantId: variantId || undefined,
      experimentId: experimentId || undefined,
      confidenceBucket: properties?.confidenceBucket as string || undefined,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
      pageUrl: window.location.href,
      referrer: document.referrer || undefined,
      deviceType,
      language: navigator.language,
    });

    // Also log to console for debugging
    console.log('[Track]', eventName, { sessionId, variantId, experimentId, ...properties });
  }, [sessionId, variantId, experimentId, trackMutation]);

  const setExperiment = useCallback((expId: string, varId: string) => {
    setExperimentId(expId);
    setVariantId(varId);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hotel_experiment_id', expId);
      sessionStorage.setItem('hotel_variant_id', varId);
    }
  }, []);

  return (
    <TrackingContext.Provider value={{ sessionId, variantId, experimentId, trackEvent, setExperiment }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}

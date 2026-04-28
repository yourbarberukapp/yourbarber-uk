'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoOverrides {
  name?: string;
  address?: string;
  googleMapsUrl?: string;
  openingHours?: any;
}

interface DemoOverrideContextType {
  overrides: Record<string, DemoOverrides>;
  setOverride: (slug: string, data: DemoOverrides) => void;
  clearOverride: (slug: string) => void;
}

const DemoOverrideContext = createContext<DemoOverrideContextType | undefined>(undefined);

export function DemoOverrideProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, DemoOverrides>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('demo_overrides');
    if (saved) {
      try {
        setOverrides(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse overrides from localStorage');
      }
    }
  }, []);

  const setOverride = (slug: string, data: DemoOverrides) => {
    const newOverrides = { ...overrides, [slug]: data };
    setOverrides(newOverrides);
    localStorage.setItem('demo_overrides', JSON.stringify(newOverrides));
    
    // Set cookie for server-side access
    const encodedData = btoa(encodeURIComponent(JSON.stringify(data)));
    document.cookie = `demo_override_${slug}=${encodedData}; path=/; max-age=31536000; samesite=lax`;
  };

  const clearOverride = (slug: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[slug];
    setOverrides(newOverrides);
    localStorage.setItem('demo_overrides', JSON.stringify(newOverrides));
    
    // Clear cookie
    document.cookie = `demo_override_${slug}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  return (
    <DemoOverrideContext.Provider value={{ overrides, setOverride, clearOverride }}>
      {children}
    </DemoOverrideContext.Provider>
  );
}

export function useDemoOverride() {
  const context = useContext(DemoOverrideContext);
  if (context === undefined) {
    throw new Error('useDemoOverride must be used within a DemoOverrideProvider');
  }
  return context;
}

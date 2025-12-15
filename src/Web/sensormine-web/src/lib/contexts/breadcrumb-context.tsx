/**
 * Breadcrumb Context
 * 
 * Provides human-readable names for dynamic route segments (IDs)
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BreadcrumbName {
  id: string;
  name: string;
  type: 'dashboard' | 'device' | 'deviceType' | 'schema' | 'asset' | 'alert' | 'user';
}

interface BreadcrumbContextType {
  names: Map<string, BreadcrumbName>;
  setName: (id: string, name: string, type: BreadcrumbName['type']) => void;
  getName: (id: string) => string | undefined;
  clearNames: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [names] = useState<Map<string, BreadcrumbName>>(new Map());

  const setName = useCallback((id: string, name: string, type: BreadcrumbName['type']) => {
    names.set(id, { id, name, type });
  }, [names]);

  const getName = useCallback((id: string) => {
    return names.get(id)?.name;
  }, [names]);

  const clearNames = useCallback(() => {
    names.clear();
  }, [names]);

  return (
    <BreadcrumbContext.Provider value={{ names, setName, getName, clearNames }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context;
}

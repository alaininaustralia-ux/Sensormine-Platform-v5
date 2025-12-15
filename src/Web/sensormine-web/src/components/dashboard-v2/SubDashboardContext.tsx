'use client';

// Sub-Dashboard Context - Provides parameter context to widgets in sub-dashboards

import { createContext, useContext, ReactNode } from 'react';

export interface SubDashboardContextValue {
  parameterId?: string;
  parameterType?: 'deviceId' | 'assetId';
  parameterName?: string;
  isSubDashboard: boolean;
}

const SubDashboardContext = createContext<SubDashboardContextValue>({
  isSubDashboard: false,
});

interface SubDashboardProviderProps {
  children: ReactNode;
  parameterId?: string;
  parameterType?: 'deviceId' | 'assetId';
  parameterName?: string;
}

export function SubDashboardProvider({
  children,
  parameterId,
  parameterType,
  parameterName,
}: SubDashboardProviderProps) {
  const value: SubDashboardContextValue = {
    parameterId,
    parameterType,
    parameterName,
    isSubDashboard: !!parameterId && !!parameterType,
  };

  return (
    <SubDashboardContext.Provider value={value}>
      {children}
    </SubDashboardContext.Provider>
  );
}

export function useSubDashboard() {
  return useContext(SubDashboardContext);
}

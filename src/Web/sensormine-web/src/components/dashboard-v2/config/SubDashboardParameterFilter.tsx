'use client';

// Sub-Dashboard Parameter Filter Component
// Shows checkbox to use sub-dashboard parameter (deviceId or assetId) as a filter

import { useSubDashboard } from '../SubDashboardContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface SubDashboardParameterFilterProps {
  enabled: boolean;
  supportedTypes: ('deviceId' | 'assetId')[];
  onChange: (enabled: boolean) => void;
  description?: string;
}

export function SubDashboardParameterFilter({
  enabled,
  supportedTypes,
  onChange,
  description,
}: SubDashboardParameterFilterProps) {
  const subDashboard = useSubDashboard();

  // Only show in sub-dashboard context
  if (!subDashboard.isSubDashboard) {
    return null;
  }

  // Check if current parameter type is supported
  const isSupported = subDashboard.parameterType && supportedTypes.includes(subDashboard.parameterType);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-subdashboard-param"
              checked={enabled}
              onCheckedChange={(checked) => onChange(checked === true)}
            />
            <Label
              htmlFor="use-subdashboard-param"
              className="text-sm font-medium text-blue-900 cursor-pointer"
            >
              Filter by sub-dashboard parameter
            </Label>
          </div>
          
          <p className="text-xs text-blue-700">
            {description || `Automatically filter data by the ${subDashboard.parameterType === 'deviceId' ? 'device' : 'asset'} selected in the parent dashboard`}
          </p>
          
          {enabled && subDashboard.parameterName && (
            <Alert className="mt-2">
              <AlertDescription className="text-xs">
                <strong>Current filter:</strong> {subDashboard.parameterName}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

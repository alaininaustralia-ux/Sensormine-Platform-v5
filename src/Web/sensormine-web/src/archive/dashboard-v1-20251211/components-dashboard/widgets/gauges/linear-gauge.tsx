/**
 * Linear Gauge Component
 * 
 * Displays a horizontal or vertical bar gauge with threshold zones and value indicator.
 */

'use client';

export interface LinearGaugeProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Unit of measurement */
  unit?: string;
  /** Warning threshold (yellow) */
  warningThreshold?: number;
  /** Critical threshold (red) */
  criticalThreshold?: number;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Height in pixels (for horizontal) or width (for vertical) */
  thickness?: number;
  /** Length in pixels */
  length?: number;
  /** CSS class name */
  className?: string;
}

export function LinearGauge({
  value,
  min = 0,
  max = 100,
  unit = '',
  warningThreshold,
  criticalThreshold,
  orientation = 'horizontal',
  thickness = 40,
  length = 200,
  className = '',
}: LinearGaugeProps) {
  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine active zone
  const getActiveZone = () => {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return 'critical';
    }
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return 'warning';
    }
    return 'normal';
  };
  
  const activeZone = getActiveZone();
  
  // Calculate threshold percentages
  const warningPercentage = warningThreshold 
    ? ((warningThreshold - min) / (max - min)) * 100 
    : 0;
  const criticalPercentage = criticalThreshold 
    ? ((criticalThreshold - min) / (max - min)) * 100 
    : 0;
  
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div 
      className={`flex ${isHorizontal ? 'flex-col' : 'flex-row'} gap-2 ${className}`}
      data-testid="linear-gauge"
      data-orientation={orientation}
    >
      {/* Labels */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col-reverse'} justify-between text-xs text-muted-foreground`}>
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
      
      {/* Gauge container */}
      <div 
        className="relative bg-muted rounded-full"
        style={{
          width: isHorizontal ? `${length}px` : `${thickness}px`,
          height: isHorizontal ? `${thickness}px` : `${length}px`,
        }}
      >
        {/* Threshold zones */}
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          {/* Normal zone (green) */}
          <div 
            data-testid="threshold-zone"
            data-zone="normal"
            className={`bg-green-200 ${activeZone === 'normal' ? 'active' : ''}`}
            style={{
              [isHorizontal ? 'width' : 'height']: warningThreshold 
                ? `${warningPercentage}%` 
                : '100%',
            }}
          />
          
          {/* Warning zone (yellow) */}
          {warningThreshold && (
            <div 
              data-testid="threshold-zone"
              data-zone="warning"
              className={`bg-yellow-200 ${activeZone === 'warning' ? 'active' : ''}`}
              style={{
                [isHorizontal ? 'width' : 'height']: criticalThreshold 
                  ? `${criticalPercentage - warningPercentage}%` 
                  : `${100 - warningPercentage}%`,
              }}
            />
          )}
          
          {/* Critical zone (red) */}
          {criticalThreshold && (
            <div 
              data-testid="threshold-zone"
              data-zone="critical"
              className={`bg-red-200 ${activeZone === 'critical' ? 'active' : ''}`}
              style={{
                [isHorizontal ? 'width' : 'height']: `${100 - criticalPercentage}%`,
              }}
            />
          )}
        </div>
        
        {/* Value bar */}
        <div 
          data-testid="gauge-bar"
          className="absolute inset-0 bg-primary rounded-full transition-all duration-500"
          style={{
            [isHorizontal ? 'width' : 'height']: `${clampedPercentage}%`,
            [isHorizontal ? 'left' : 'bottom']: 0,
          }}
        />
        
        {/* Threshold markers */}
        {warningThreshold && (
          <div 
            data-testid="threshold-marker"
            className="absolute w-0.5 h-full bg-yellow-600"
            style={{
              [isHorizontal ? 'left' : 'bottom']: `${warningPercentage}%`,
            }}
          />
        )}
        
        {criticalThreshold && (
          <div 
            data-testid="threshold-marker"
            className="absolute w-0.5 h-full bg-red-600"
            style={{
              [isHorizontal ? 'left' : 'bottom']: `${criticalPercentage}%`,
            }}
          />
        )}
        
        {/* Value indicator */}
        <div 
          data-testid="value-indicator"
          className="absolute w-1 h-full bg-white border-2 border-primary shadow-lg transition-all duration-500"
          style={{
            [isHorizontal ? 'left' : 'bottom']: `${clampedPercentage}%`,
            [isHorizontal ? 'transform' : 'transform']: 'translateX(-50%)',
          }}
        />
      </div>
      
      {/* Current value display */}
      <div className="text-center text-sm font-semibold">
        {value.toFixed(1)} {unit}
      </div>
    </div>
  );
}

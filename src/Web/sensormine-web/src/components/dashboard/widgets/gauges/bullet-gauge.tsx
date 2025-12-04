/**
 * Bullet Gauge Component
 * 
 * Implements Stephen Few's bullet graph design for compact performance visualization.
 * Shows qualitative ranges, comparative measure (target), and featured measure (actual value).
 */

'use client';

export interface BulletRange {
  label: string;
  max: number;
  color: string;
}

export interface BulletGaugeProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Unit of measurement */
  unit?: string;
  /** Target value for comparison */
  target?: number;
  /** Qualitative ranges */
  ranges?: BulletRange[];
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Compact mode for dashboards */
  compact?: boolean;
  /** CSS class name */
  className?: string;
}

export function BulletGauge({
  value,
  min = 0,
  max = 100,
  unit = '',
  target = 80,
  ranges = [
    { label: 'Poor', max: 40, color: '#ef4444' },
    { label: 'Fair', max: 70, color: '#eab308' },
    { label: 'Good', max: 100, color: '#22c55e' },
  ],
  orientation = 'horizontal',
  compact = false,
  className = '',
}: BulletGaugeProps) {
  // Calculate percentages
  const valuePercentage = ((value - min) / (max - min)) * 100;
  const clampedValuePercentage = Math.max(0, Math.min(100, valuePercentage));
  
  const targetPercentage = ((target - min) / (max - min)) * 100;
  const clampedTargetPercentage = Math.max(0, Math.min(100, targetPercentage));
  
  // Determine performance level
  const getPerformanceLevel = () => {
    for (let i = 0; i < ranges.length; i++) {
      if (value <= ranges[i].max) {
        return ranges[i].label.toLowerCase();
      }
    }
    return ranges[ranges.length - 1].label.toLowerCase();
  };
  
  const performanceLevel = getPerformanceLevel();
  
  // Determine comparison text
  const getComparisonText = () => {
    if (value >= target) {
      return `Exceeds target by ${((value - target) / target * 100).toFixed(1)}%`;
    } else {
      return `Below target by ${((target - value) / target * 100).toFixed(1)}%`;
    }
  };
  
  const isHorizontal = orientation === 'horizontal';
  const height = compact ? 30 : 50;
  const width = compact ? 200 : 300;
  
  return (
    <div 
      className={`flex flex-col gap-2 ${className}`}
      data-testid="bullet-gauge"
      data-orientation={orientation}
    >
      {/* Gauge container */}
      <div 
        className={`relative ${compact ? '' : 'p-2'}`}
        style={{
          width: isHorizontal ? `${width}px` : `${height}px`,
          height: isHorizontal ? `${height}px` : `${width}px`,
        }}
      >
        {/* Qualitative ranges (background) */}
        <div className="absolute inset-0 flex overflow-hidden">
          {ranges.map((range, index) => {
            const prevMax = index > 0 ? ranges[index - 1].max : min;
            const rangePercentage = ((range.max - prevMax) / (max - min)) * 100;
            
            return (
              <div
                key={range.label}
                data-testid="bullet-range"
                data-range={range.label}
                className={`${performanceLevel === range.label.toLowerCase() ? 'active' : ''}`}
                style={{
                  [isHorizontal ? 'width' : 'height']: `${rangePercentage}%`,
                  backgroundColor: range.color,
                  opacity: 0.3,
                }}
              />
            );
          })}
        </div>
        
        {/* Featured measure (actual value bar) */}
        <div 
          data-testid="value-bar"
          className="absolute bg-primary transition-all duration-500"
          style={{
            [isHorizontal ? 'width' : 'height']: `${clampedValuePercentage}%`,
            [isHorizontal ? 'height' : 'width']: compact ? '60%' : '70%',
            [isHorizontal ? 'top' : 'left']: '50%',
            transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
          }}
        />
        
        {/* Comparative measure (target line) */}
        <div 
          data-testid="target-line"
          className="absolute bg-foreground transition-all duration-500"
          style={{
            [isHorizontal ? 'left' : 'bottom']: `${clampedTargetPercentage}%`,
            [isHorizontal ? 'width' : 'height']: '3px',
            [isHorizontal ? 'height' : 'width']: '100%',
          }}
        />
      </div>
      
      {/* Value labels */}
      {!compact && (
        <div className="flex justify-between items-center text-sm">
          <div className="font-semibold">
            {value.toFixed(1)} {unit}
          </div>
          <div 
            className="text-xs text-muted-foreground"
            data-performance={performanceLevel}
          >
            {getComparisonText()}
          </div>
          <div className="text-xs text-muted-foreground">
            Target: {target} {unit}
          </div>
        </div>
      )}
      
      {/* Compact value display */}
      {compact && (
        <div className="flex justify-between text-xs">
          <span className="font-semibold">{value.toFixed(1)}{unit}</span>
          <span className="text-muted-foreground">Target: {target}{unit}</span>
        </div>
      )}
    </div>
  );
}

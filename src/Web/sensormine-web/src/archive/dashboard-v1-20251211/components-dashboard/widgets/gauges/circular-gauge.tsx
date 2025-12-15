/**
 * Circular Gauge Component
 * 
 * Displays a circular gauge with current value, thresholds, and smooth animations.
 * Supports full circle, semi-circle, and custom arc configurations.
 */

'use client';

export interface CircularGaugeProps {
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
  /** Gauge size in pixels */
  size?: number;
  /** Arc start angle in degrees (0 = top) */
  startAngle?: number;
  /** Arc end angle in degrees */
  endAngle?: number;
  /** Enable gradient fill */
  gradient?: boolean;
  /** Show needle pointer */
  showNeedle?: boolean;
  /** CSS class name */
  className?: string;
}

export function CircularGauge({
  value,
  min = 0,
  max = 100,
  unit = '',
  warningThreshold,
  criticalThreshold,
  size = 120,
  startAngle = 0,
  endAngle = 360,
  gradient = false,
  showNeedle = false,
  className = '',
}: CircularGaugeProps) {
  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine color based on thresholds
  const getColor = () => {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return 'text-red-600';
    }
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };
  
  const getStrokeColor = () => {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return '#dc2626'; // red-600
    }
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return '#ca8a04'; // yellow-600
    }
    return '#16a34a'; // green-600
  };
  
  // SVG circle parameters
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate arc length based on start and end angles
  const arcAngle = endAngle - startAngle;
  const arcLength = (arcAngle / 360) * circumference;
  const strokeDashoffset = arcLength - (clampedPercentage / 100) * arcLength;
  
  // Calculate rotation to start from startAngle
  const rotation = startAngle - 90; // -90 because SVG starts at 3 o'clock
  
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        className="transform"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
          strokeDasharray={arcLength}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradient ? 'url(#gradient)' : getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
        
        {/* Gradient definition */}
        {gradient && (
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        )}
      </svg>
      
      <div className="text-center" style={{ transform: 'rotate(0deg)' }}>
        <div className={`text-3xl font-bold ${getColor()} transition-colors duration-300`}>
          {value.toFixed(1)}
          {unit && <span className="text-base ml-1">{unit}</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {min} - {max} {unit}
        </div>
      </div>
    </div>
  );
}

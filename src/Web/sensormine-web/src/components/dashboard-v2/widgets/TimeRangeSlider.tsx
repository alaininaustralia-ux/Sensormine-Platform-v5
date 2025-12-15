'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';

interface TimeRangeSliderProps {
  minTime: number; // Unix timestamp
  maxTime: number; // Unix timestamp
  currentRange: [number, number]; // Current selected range
  onChange: (range: [number, number]) => void;
  className?: string;
}

export function TimeRangeSlider({
  minTime,
  maxTime,
  currentRange,
  onChange,
  className = '',
}: TimeRangeSliderProps) {
  const [localRange, setLocalRange] = useState<[number, number]>(currentRange);

  useEffect(() => {
    setLocalRange(currentRange);
  }, [currentRange]);

  const handleValueChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setLocalRange(newRange);
  };

  const handleValueCommit = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    onChange(newRange);
  };

  const formatTime = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'MMM dd, HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(localRange[0])}</span>
        <span>{formatTime(localRange[1])}</span>
      </div>
      <Slider
        min={minTime}
        max={maxTime}
        step={Math.max(1, Math.floor((maxTime - minTime) / 1000))}
        value={[localRange[0], localRange[1]]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(minTime)}</span>
        <span>{formatTime(maxTime)}</span>
      </div>
    </div>
  );
}

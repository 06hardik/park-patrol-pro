import { useMemo } from 'react';
import { CountHistoryPoint } from '@/types/parking';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: CountHistoryPoint[];
  threshold?: number;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ 
  data, 
  threshold, 
  width = 120, 
  height = 32, 
  className 
}: SparklineProps) {
  const { path, thresholdY, minY, maxY } = useMemo(() => {
    if (!data.length) return { path: '', thresholdY: 0, minY: 0, maxY: 0 };

    const counts = data.map(d => d.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const range = maxCount - minCount || 1;
    
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((d.count - minCount) / range) * chartHeight;
      return `${x},${y}`;
    });
    
    const thresholdY = threshold 
      ? padding + chartHeight - ((threshold - minCount) / range) * chartHeight
      : 0;
    
    return { 
      path: `M ${points.join(' L ')}`,
      thresholdY,
      minY: minCount,
      maxY: maxCount,
    };
  }, [data, threshold, width, height]);

  if (!data.length) {
    return <div className={cn('bg-muted rounded', className)} style={{ width, height }} />;
  }

  return (
    <svg 
      width={width} 
      height={height} 
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Threshold line */}
      {threshold && thresholdY > 0 && thresholdY < height && (
        <line
          x1={0}
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          className="stroke-status-violating/50"
          strokeWidth={1}
          strokeDasharray="4 2"
        />
      )}
      
      {/* Sparkline */}
      <path
        d={path}
        fill="none"
        className="stroke-primary"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={width - 2}
          cy={2 + (height - 4) - ((data[data.length - 1].count - minY) / (maxY - minY || 1)) * (height - 4)}
          r={3}
          className="fill-primary"
        />
      )}
    </svg>
  );
}
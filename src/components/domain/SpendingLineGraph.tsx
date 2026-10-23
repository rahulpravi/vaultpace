'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/store';

export interface TrendPoint {
  label: string; // e.g. "Oct 1", "Oct 7"
  amountCents: number;
}

interface SpendingLineGraphProps {
  points: TrendPoint[];
  height?: number;
  className?: string;
}

export const SpendingLineGraph: React.FC<SpendingLineGraphProps> = ({
  points,
  height = 180,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-text-muted text-xs border border-dashed border-border rounded-2xl">
        No transaction history for this period
      </div>
    );
  }

  const width = 360;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...points.map((p) => p.amountCents), 10000); // At least $100

  // Coordinates
  const coords = points.map((p, i) => {
    const x = paddingLeft + (i / Math.max(points.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - (p.amountCents / maxVal) * chartHeight;
    return { x, y, point: p };
  });

  // Construct SVG Path
  const pathD = coords.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;

  return (
    <div className={`p-4 bg-surface border border-border/80 rounded-2xl shadow-card ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-text uppercase tracking-wider">
          Spending Velocity
        </span>
        {hoveredIdx !== null ? (
          <span className="text-xs font-bold text-accent">
            {points[hoveredIdx].label}: {formatCurrency(points[hoveredIdx].amountCents)}
          </span>
        ) : (
          <span className="text-2xs text-text-muted">Tap curve for details</span>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Guidelines & Y-Axis Labels */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-text-muted text-[10px] font-mono"
                >
                  {formatCurrency(val).replace('.00', '')}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#curveGradient)" />

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {coords.map((c, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 5 : 3}
                  className="fill-surface stroke-accent cursor-pointer transition-all"
                  strokeWidth={isHovered ? 3 : 2}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onTouchStart={() => setHoveredIdx(i)}
                />
                {/* X-axis labels for sparse points */}
                {(i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) && (
                  <text
                    x={c.x}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {c.point.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

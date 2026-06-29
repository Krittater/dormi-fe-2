"use client";

import { useId } from "react";

interface RevenueChartProps {
  /** One cumulative-revenue value per day of the current month. */
  points: number[];
  /** X-axis labels rendered evenly below the chart. */
  xLabels: string[];
  className?: string;
}

const VIEW_W = 600;
const VIEW_H = 220;
const PAD_X = 4;
const PAD_TOP = 12;
const PAD_BOTTOM = 4;

function compactBaht(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(Math.round(value));
}

export function RevenueChart({ points, xLabels, className }: RevenueChartProps) {
  const gradientId = useId();
  const series = points.length >= 2 ? points : [...points, ...points, 0].slice(0, 2);
  const max = Math.max(...series, 1);
  const innerW = VIEW_W - PAD_X * 2;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

  const coords = series.map((v, i) => {
    const x = PAD_X + i * stepX;
    const y = PAD_TOP + innerH - (v / max) * innerH;
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L${last[0].toFixed(1)},${(PAD_TOP + innerH).toFixed(
    1
  )} L${first[0].toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={className}>
      <div className="flex gap-3">
        <div className="flex w-10 shrink-0 flex-col justify-between py-1 text-right text-[10px] text-gray-400">
          {[...gridLines].reverse().map((g) => (
            <span key={g}>{compactBaht(max * g)}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-44 w-full"
            preserveAspectRatio="none"
            role="img"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {gridLines.map((g) => {
              const y = PAD_TOP + innerH * g;
              return (
                <line
                  key={g}
                  x1={PAD_X}
                  x2={VIEW_W - PAD_X}
                  y1={y}
                  y2={y}
                  stroke="var(--gray-100)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={last[0]}
              cy={last[1]}
              r={4}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400">
            {xLabels.map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

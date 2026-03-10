"use client";

/**
 * TrendChart — hand-rolled SVG bar chart for weekly/monthly trends.
 * No charting library needed — keeps the PWA bundle small.
 */

import type { PeriodTotal } from "@/lib/analytics";

interface TrendChartProps {
  data: PeriodTotal[];
  height?: number;
  /** Show as dollars (true) or meal count (false) */
  showDollars?: boolean;
}

export default function TrendChart({ data, height = 140, showDollars = true }: TrendChartProps) {
  if (data.length === 0) return null;

  const values = data.map((d) => (showDollars ? d.totalCents : d.mealCount));
  const maxVal = Math.max(...values, 1);

  const barWidth = Math.min(28, Math.floor(280 / data.length) - 4);
  const chartWidth = data.length * (barWidth + 4) + 4;
  const barAreaHeight = height - 28; // leave room for labels

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg
        width={chartWidth}
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="block"
      >
        {data.map((d, i) => {
          const val = showDollars ? d.totalCents : d.mealCount;
          const barHeight = maxVal > 0 ? (val / maxVal) * barAreaHeight : 0;
          const x = i * (barWidth + 4) + 4;
          const y = barAreaHeight - barHeight;
          const hasData = val > 0;

          return (
            <g key={d.start}>
              {/* Bar */}
              <rect
                x={x}
                y={hasData ? y : barAreaHeight - 2}
                width={barWidth}
                height={hasData ? barHeight : 2}
                rx={3}
                className={hasData ? "fill-emerald-400" : "fill-stone-200"}
              />
              {/* Value label (show on hover via title) */}
              {hasData && (
                <title>
                  {d.label}: {showDollars ? `$${(d.totalCents / 100).toFixed(2)}` : `${d.mealCount} meals`}
                </title>
              )}
              {/* X-axis label — show every other label on small datasets, every 3rd on large */}
              {(data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
                <text
                  x={x + barWidth / 2}
                  y={height - 2}
                  textAnchor="middle"
                  className="fill-stone-400 text-[9px]"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Miniature sparkline chart — for inline use in stat cards.
 */
export function Sparkline({ data, width = 80, height = 24 }: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="block">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-400"
      />
    </svg>
  );
}

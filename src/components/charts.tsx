'use client';

import { useId } from 'react';
import type { DayStat } from '@/lib/utils/stats';
import type { SeriesPoint, YearHeatmapData } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils/cn';

const HEAT_LEVELS = [0, 1, 2, 3, 4, 5] as const;

function heatFill(level: number): string {
  return `rgb(var(--heat-${Math.min(5, Math.max(0, level))}))`;
}

function usableColor(color?: string | null): string | null {
  if (!color) return null;
  let hex = color.trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luminance > 0.78) return null;
  return `#${hex}`;
}

export function Heatmap({
  weeks,
  color,
  className,
}: {
  weeks: boolean[][];
  color?: string | null;
  className?: string;
}) {
  const doneFill = usableColor(color) ?? 'rgb(var(--heat-3))';
  return (
    <div className={cn('flex gap-[3px]', className)} aria-label="Habit completion heatmap">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-1 flex-col gap-[3px]">
          {week.map((done, dayIndex) => (
            <div
              key={dayIndex}
              className="aspect-square w-full rounded-[3px] transition-colors duration-150"
              style={{ backgroundColor: done ? doneFill : heatFill(0) }}
              title={done ? 'Completed' : 'Not completed'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function YearHeatmap({ data }: { data: YearHeatmapData }) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="min-w-[700px]">
          <div className="mb-1.5 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px] px-0.5">
            {data.monthLabels.map((month) => (
              <span
                key={`${month.label}-${month.weekIndex}`}
                className="overflow-visible whitespace-nowrap text-[10px] font-medium text-muted"
                style={{ gridColumnStart: month.weekIndex + 1 }}
              >
                {month.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px]">
            {data.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-[3px]">
                {week.map((cell) => (
                  <div
                    key={cell.dateKey}
                    className="aspect-square w-full rounded-[3px] transition-colors duration-150 hover:ring-1 hover:ring-accent/60"
                    style={{ backgroundColor: cell.inRange ? heatFill(cell.level) : 'rgb(var(--raised))' }}
                    title={
                      cell.inRange
                        ? `${new Date(`${cell.dateKey}T00:00:00`).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })} · ${cell.count} completed`
                        : 'Out of range'
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          <span className="font-semibold text-text">{data.activeDays}</span> active days
          <span className="mx-1.5 text-line">•</span>
          <span className="font-semibold text-text">{data.total}</span> completions
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span>Less</span>
          {HEAT_LEVELS.map((level) => (
            <span
              key={level}
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ backgroundColor: heatFill(level) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export function WeeklyBarChart({ data, height = 180 }: { data: DayStat[]; height?: number }) {
  const max = Math.max(1, ...data.map((day) => day.completed));
  return (
    <div className="w-full">
      <div className="relative" style={{ height }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-line/70" />
          ))}
        </div>
        <div className="relative flex h-full items-end gap-2">
          {data.map((day, index) => {
            const pct = day.completed === 0 ? 3 : Math.max(8, (day.completed / max) * 100);
            const isToday = index === data.length - 1;
            return (
              <div key={day.key} className="group flex h-full flex-1 flex-col justify-end">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110',
                      isToday ? 'bg-accent' : 'bg-accent/55'
                    )}
                    style={{ height: `${pct}%` }}
                    title={`${day.label} · ${day.completed} of ${day.total} tasks completed`}
                  />
                </div>
                <span
                  className={cn(
                    'mt-2 block text-center text-[10px] font-medium',
                    isToday ? 'text-text' : 'text-muted'
                  )}
                >
                  {day.label}
                </span>
                <span className="mt-0.5 block text-center text-[10px] font-semibold text-muted/80">
                  {day.completed}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LineChart({ data, height = 220 }: { data: SeriesPoint[]; height?: number }) {
  const uid = useId().replace(/:/g, '');
  const width = 640;
  const top = 16;
  const bottom = 28;
  const left = 10;
  const right = 10;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const maxValue = Math.max(0, ...data.map((point) => point.value));
  const max = Math.max(1, maxValue);
  const n = data.length;
  const xFor = (index: number) => (n <= 1 ? left + innerW / 2 : left + (index / (n - 1)) * innerW);
  const yFor = (value: number) => top + innerH - (value / max) * innerH;
  const points = data.map((point, index) => `${xFor(index)},${yFor(point.value)}`);
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point}`).join(' ');
  const area = `${line} L${xFor(n - 1)},${top + innerH} L${xFor(0)},${top + innerH} Z`;
  const labelIndices = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : Array.from({ length: n }, (_, index) => index);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Progress line chart">
      <defs>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.24" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((lineIndex) => {
        const y = top + (lineIndex / 3) * innerH;
        return <line key={lineIndex} x1={left} x2={width - right} y1={y} y2={y} stroke="rgb(var(--line))" strokeWidth={1} />;
      })}
      {n > 0 && <path d={area} fill={`url(#${uid}-area)`} />}
      {n > 0 && (
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {labelIndices.map((index) => (
        <text
          key={index}
          x={xFor(index)}
          y={height - 8}
          textAnchor={index === 0 ? 'start' : index === n - 1 ? 'end' : 'middle'}
          style={{ fill: 'rgb(var(--muted))', fontSize: 10, fontWeight: 500 }}
        >
          {data[index]?.label}
        </text>
      ))}
      <text x={left} y={top - 4} style={{ fill: 'rgb(var(--muted))', fontSize: 10, fontWeight: 600 }}>
        {maxValue}
      </text>
    </svg>
  );
}

export function BarChart({
  data,
  height = 170,
  unit = 'min',
}: {
  data: SeriesPoint[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <div className="w-full">
      <div className="relative" style={{ height }}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-line/70" />
          ))}
        </div>
        <div className="relative flex h-full items-end gap-1">
          {data.map((point, index) => {
            const pct = point.value === 0 ? 2 : Math.max(6, (point.value / max) * 100);
            const showLabel = index === 0 || index === data.length - 1 || index % 3 === 0;
            return (
              <div key={point.key} className="group flex h-full flex-1 flex-col justify-end">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-accent/70 transition-all duration-300 group-hover:bg-accent"
                    style={{ height: `${pct}%` }}
                    title={`${point.label} · ${point.value} ${unit}`}
                  />
                </div>
                <span className="mt-1.5 block h-3 text-center text-[9px] font-medium text-muted">
                  {showLabel ? point.label.split(' ').slice(-1)[0] : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

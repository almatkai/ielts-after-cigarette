'use client'

import * as React from 'react'
import { motion, useAnimationFrame } from 'motion/react'

import { cn } from '#/lib/utils.ts'

export interface AuroraBarsProps {
  /** @default 24 */
  barCount?: number
  /** Gradient color stops, bottom to top. */
  colors?: string[]
  /** Maximum bar height as fraction of container height. */
  maxHeightRatio?: number
  /** Minimum bar height as fraction of container height. */
  minHeightRatio?: number
  /** Undulation speed. */
  speed?: number
  /** @default 3 */
  gap?: number
  /** Blur per bar in pixels, creates soft glow. */
  blur?: number
  /** @default "#000000" */
  background?: string
  className?: string
}

function barHeight(
  index: number,
  total: number,
  time: number,
  minHeight: number,
  maxHeight: number,
) {
  const normalizedIndex = index / (total - 1)
  const arch = Math.sin(normalizedIndex * Math.PI)
  const phaseOne = (index / total) * Math.PI * 2
  const phaseTwo = (index / total) * Math.PI * 5.3

  const wave =
    0.5 +
    0.25 * Math.sin(time * 1.1 + phaseOne) +
    0.25 * Math.sin(time * 0.7 + phaseTwo)

  const blendedHeight = arch * 0.65 + wave * 0.35

  return minHeight + blendedHeight * (maxHeight - minHeight)
}

export function AuroraBars({
  barCount = 24,
  colors = ['#ffd6eb', '#ff9acb', '#ff5aa6', '#ff2d78', '#00000000'],
  maxHeightRatio = 0.92,
  minHeightRatio = 0.18,
  speed = 0.5,
  gap = 3,
  blur = 0,
  background = '#000000',
  className,
}: AuroraBarsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [heights, setHeights] = React.useState(() =>
    Array.from({ length: barCount }, (_, index) =>
      barHeight(index, barCount, 0, minHeightRatio, maxHeightRatio),
    ),
  )
  const timeRef = React.useRef(0)

  useAnimationFrame((_frameTime, delta) => {
    timeRef.current += (delta / 1000) * speed
    const time = timeRef.current

    setHeights(
      Array.from({ length: barCount }, (_, index) =>
        barHeight(index, barCount, time, minHeightRatio, maxHeightRatio),
      ),
    )
  })

  const gradientStops = colors
    .map(
      (color, index) =>
        `${color} ${Math.round((index / (colors.length - 1)) * 100)}%`,
    )
    .join(', ')
  const gradient = `linear-gradient(to top, ${gradientStops})`

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={{ background }}
    >
      <div className="absolute inset-0 flex items-end">
        {Array.from({ length: barCount }).map((_, index) => {
          const heightFraction = heights[index] ?? maxHeightRatio

          return (
            <div
              key={index}
              className="flex-1"
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                padding: `0 ${gap / 2}px`,
              }}
            >
              <motion.div
                style={{
                  width: '100%',
                  height: `${heightFraction * 100}%`,
                  background: gradient,
                  borderRadius: '9999px 9999px 0 0',
                  filter: `blur(${blur}px)`,
                  opacity: 0.85,
                }}
              />
            </div>
          )
        })}
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 100%, transparent 40%, #000000cc 100%)',
        }}
      />
    </div>
  )
}

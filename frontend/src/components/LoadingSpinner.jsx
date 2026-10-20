import { useState, useEffect } from 'react';

/**
 * LoadingSpinner renders a sleek, circular SVG spinner.
 * Supports customizable sizes, colors, optional labels, vertical/horizontal orientation,
 * and an optional cold-start notice if requests take longer than coldStartDelay (e.g. on Render free tier).
 */
export function LoadingSpinner({
  size = 'md',
  color = 'var(--ce-primary, #0f3b75)',
  label = null,
  orientation = 'horizontal',
  showColdStartHint = false,
  coldStartDelay = 3500,
  className = '',
  style = {},
  'aria-label': ariaLabel,
}) {
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    if (!showColdStartHint) return;
    const timer = setTimeout(() => {
      setIsDelayed(true);
    }, coldStartDelay);
    return () => clearTimeout(timer);
  }, [showColdStartHint, coldStartDelay]);

  const sizePx = {
    xs: 14,
    sm: 18,
    md: 26,
    lg: 36,
    xl: 48,
  }[size] || 26;

  const strokeWidth = size === 'xs' || size === 'sm' ? 2.5 : size === 'xl' ? 3.5 : 3;
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`ce-loading-spinner-wrapper ${isVertical ? 'ce-loading-vertical' : 'ce-loading-horizontal'} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: isVertical ? 'center' : 'flex-start',
        flexDirection: isVertical ? 'column' : 'row',
        gap: isVertical ? '0.65rem' : '0.5rem',
        ...style,
      }}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || label || 'Loading content'}
    >
      <svg
        className="ce-spinner"
        viewBox="0 0 24 24"
        width={sizePx}
        height={sizePx}
        style={{ color, flexShrink: 0 }}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5"
          stroke="currentColor"
        />
      </svg>

      {(label || ariaLabel) && (
        <span
          className="ce-loading-label"
          style={{
            fontSize: size === 'xs' ? '0.75rem' : size === 'sm' ? '0.82rem' : '0.9rem',
            color: 'var(--ce-ink, #292524)',
            fontWeight: 500,
            textAlign: isVertical ? 'center' : 'left',
          }}
        >
          {label || ariaLabel}
        </span>
      )}

      {isDelayed && (
        <span
          className="ce-loading-cold-start-note"
          style={{
            fontSize: '0.78rem',
            color: 'var(--ce-muted, #78716c)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            animation: 'ce-fade-in 250ms ease-out',
          }}
        >
          <span className="ce-cold-start-dot" style={{ width: 6, height: 6 }} aria-hidden="true" />
          <span>Waking up Render backend...</span>
        </span>
      )}
    </div>
  );
}

export default LoadingSpinner;

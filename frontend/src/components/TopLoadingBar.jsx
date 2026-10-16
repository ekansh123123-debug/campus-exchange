import { useState, useEffect, useRef } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { subscribeToActiveRequests, getActiveRequestCount } from '../lib/api-client.js';

/**
 * TopLoadingBar tracks both TanStack Query fetches/mutations and direct
 * apiRequest calls to display a smooth, responsive top progress bar.
 *
 * Given that the frontend is on Vercel and backend is on Render,
 * it includes smooth trickling progress and a helpful cold-start status badge
 * when a request takes longer than 3.5 seconds.
 */
export function TopLoadingBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [apiRequests, setApiRequests] = useState(getActiveRequestCount);

  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [prevBusy, setPrevBusy] = useState(false);

  const trickleTimerRef = useRef(null);
  const coldStartTimerRef = useRef(null);
  const completeTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  // Subscribe to apiRequest lifecycle
  useEffect(() => {
    return subscribeToActiveRequests((count) => {
      setApiRequests(count);
    });
  }, []);

  const isBusy = (isFetching > 0 || isMutating > 0 || apiRequests > 0);

  // Synchronize state transitions during render (React-recommended pattern for derived state)
  // Ensures immediate visual feedback without cascading effect triggers
  if (isBusy !== prevBusy) {
    setPrevBusy(isBusy);
    if (isBusy) {
      setVisible(true);
      setFading(false);
      setProgress((p) => (p >= 100 || p <= 0 ? 16 : p));
    } else if (visible) {
      setProgress(100);
    }
  }

  // Manage timer-based animations: cold-start warning, trickling, and completion fade-out
  useEffect(() => {
    const clearPendingCompletion = () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };

    if (isBusy) {
      // Cancel any pending completion/reset timeouts from prior requests
      clearPendingCompletion();

      // Start cold start timer (3.5s) if not already active
      if (!coldStartTimerRef.current) {
        coldStartTimerRef.current = setTimeout(() => {
          setIsColdStarting(true);
        }, 3500);
      }

      // Start trickle timer if not already active
      if (!trickleTimerRef.current) {
        trickleTimerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev < 30) return prev + Math.random() * 8 + 4;
            if (prev < 60) return prev + Math.random() * 4 + 2;
            if (prev < 80) return prev + Math.random() * 2 + 1;
            if (prev < 94) return prev + Math.random() * 0.6 + 0.3;
            // Asymptotic trickle for long Render cold starts (keeps crawling without stalling)
            if (prev < 98) return prev + (98.5 - prev) * 0.04;
            return prev;
          });
        }, 220);
      }
    } else {
      // Stop trickling and cancel cold start trigger
      if (trickleTimerRef.current) {
        clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }
      if (coldStartTimerRef.current) {
        clearTimeout(coldStartTimerRef.current);
        coldStartTimerRef.current = null;
      }

      if (visible) {
        clearPendingCompletion();

        completeTimerRef.current = setTimeout(() => {
          setFading(true);

          resetTimerRef.current = setTimeout(() => {
            setVisible(false);
            setFading(false);
            setProgress(0);
            setIsColdStarting(false);
          }, 280);
        }, 220);
      }
    }
  }, [isBusy, visible]);

  // Clean up all timers when component unmounts
  useEffect(() => {
    return () => {
      if (trickleTimerRef.current) clearInterval(trickleTimerRef.current);
      if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="ce-top-loading-bar-container"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.round(progress))}
      aria-label="Loading data from campus backend"
      aria-busy={isBusy}
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 260ms ease-in-out',
      }}
    >
      <div
        className="ce-top-loading-bar"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          opacity: fading ? 0 : 1,
          transition: progress <= 16 ? 'none' : 'width 220ms ease-out, opacity 260ms ease-in-out',
        }}
      >
        <div className="ce-top-loading-peg" />
      </div>

      {isColdStarting && (
        <aside
          className="ce-cold-start-banner"
          role="status"
          aria-live="polite"
        >
          <span className="ce-cold-start-dot" aria-hidden="true" />
          <span>Connecting to backend (Render cold start)...</span>
        </aside>
      )}
    </div>
  );
}

export default TopLoadingBar;

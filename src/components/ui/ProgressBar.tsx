import { useEffect, useState, useCallback, useRef } from "react";

interface ProgressBarProps {
  color?: string;
  height?: number;
  shadow?: boolean;
  className?: string;
}

export function ProgressBar({
  color = "bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500",
  height = 3,
  shadow = true,
  className,
}: ProgressBarProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setVisible(true);
    setProgress(0);

    // Quick initial progress
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 70) {
        currentProgress = 70;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(currentProgress);
    }, 200);
  }, []);

  const done = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(100);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
  }, []);

  const continuous = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setVisible(true);
    setProgress(0);

    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 10;
      if (currentProgress > 90) {
        currentProgress = 10;
      }
      setProgress(currentProgress);
    }, 300);
  }, []);

  useEffect(() => {
    // Listen to custom events for navigation
    const handleStart = () => start();
    const handleDone = () => done();
    const handleContinuous = () => continuous();

    window.addEventListener("progress:start", handleStart);
    window.addEventListener("progress:done", handleDone);
    window.addEventListener("progress:continuous", handleContinuous);

    return () => {
      window.removeEventListener("progress:start", handleStart);
      window.removeEventListener("progress:done", handleDone);
      window.removeEventListener("progress:continuous", handleContinuous);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [start, done, continuous]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${className || ""}`}
      style={{ height: `${height}px` }}
    >
      <div
        className={`h-full ${color} transition-all duration-200 ease-out ${
          shadow ? "shadow-[0_0_10px_rgba(59,130,246,0.5)]" : ""
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Export helper functions to control the progress bar
export const LoadingBar = {
  start: () => window.dispatchEvent(new CustomEvent("progress:start")),
  done: () => window.dispatchEvent(new CustomEvent("progress:done")),
  continuous: () => window.dispatchEvent(new CustomEvent("progress:continuous")),
};

export default ProgressBar;
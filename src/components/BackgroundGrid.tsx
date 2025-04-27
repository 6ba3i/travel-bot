import { useEffect, useRef } from 'react';

export default function BackgroundGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const RANGE = 4;                   // max ± pixels the grid will move (was 10)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return;
      const x = (e.clientX / innerWidth  - 0.5) * 2 * RANGE;
      const y = (e.clientY / innerHeight - 0.5) * 2 * RANGE;
      ref.current.style.setProperty('--shift-x', `${x}px`);
      ref.current.style.setProperty('--shift-y', `${y}px`);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [RANGE]);

  return <div ref={ref} className="bg-grid absolute inset-0 -z-10" />;
}

import React, { useEffect, useRef, useState } from "react";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*";

export function SplitFlap({ text = "", className = "", cellClassName = "", onSettled }) {
  const target = text.toUpperCase().split("");
  const [display, setDisplay] = useState(target.map(() => " "));
  const [settled, setSettled] = useState(() => target.map(() => false));
  const idxRef = useRef(0);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    const timers = [];
    let maxStep = 0;
    target.forEach((ch, i) => {
      const steps = 6 + i * 2;
      maxStep = Math.max(maxStep, steps);
      let step = 0;
      const id = setInterval(() => {
        step++;
        setDisplay((d) => {
          const n = [...d];
          n[i] = step >= steps ? ch : LETRAS[Math.floor(Math.random() * LETRAS.length)];
          return n;
        });
        if (step >= steps) {
          clearInterval(id);
          setSettled((s) => { const n = [...s]; n[i] = true; return n; });
        }
      }, 55);
      timers.push(id);
    });
    const done = setTimeout(() => onSettledRef.current?.(), maxStep * 55 + 90);
    timers.push(done);
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className={`flap-row ${className}`}>
      {display.map((c, i) => (
        <span
          key={i}
          className={`flap-cell ${c === " " ? "space" : ""} ${settled[i] ? "" : "flap-flip"} ${cellClassName}`}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </div>
  );
}

export default SplitFlap;
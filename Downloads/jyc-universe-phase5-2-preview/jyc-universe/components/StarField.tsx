"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMotionTier } from "@/hooks/useMotionTier";
import { useTravel } from "./TravelProvider";

type Star = { x: number; y: number; z: number; p: number };

/**
 * One lightweight canvas that lives behind every scene, so the stars persist
 * across routes and can streak during a camera move.
 *
 * Budget: 160 stars (full) / 70 (lite), ~30fps when idle, paused when the tab is
 * hidden, pixel ratio capped, drawn once when reduced motion is on.
 */
export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { warpRef, originRef } = useTravel();
  const tier = useMotionTier();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = tier === "full" ? 160 : 70;
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.15 + Math.random() * 0.85,
      p: Math.random() * Math.PI * 2,
    }));

    const dprCap = tier === "full" ? 1.5 : 1;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const warp = warpRef.current;
      const o = originRef.current;

      for (const s of stars) {
        const bx = s.x * w + pointer.x * s.z * -14;
        const by = s.y * h + pointer.y * s.z * -14;
        const twinkle = tier === "static" ? 1 : 0.8 + 0.2 * Math.sin(t * 0.0006 * (0.6 + s.z) + s.p);
        const alpha = (0.18 + s.z * 0.62) * twinkle;

        if (warp > 0.02) {
          const dx = bx - o.x;
          const dy = by - o.y;
          const dist = Math.hypot(dx, dy) || 1;
          const ux = dx / dist;
          const uy = dy / dist;
          const push = warp * warp * (140 + 520 * s.z);
          const len = warp * (30 + 260 * s.z);
          const x1 = bx + ux * push;
          const y1 = by + uy * push;
          ctx.strokeStyle = `rgba(236,231,220,${Math.min(1, alpha + warp * 0.4)})`;
          ctx.lineWidth = 0.6 + s.z * 0.9;
          ctx.beginPath();
          ctx.moveTo(x1 - ux * len, y1 - uy * len);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(236,231,220,${alpha})`;
          ctx.beginPath();
          ctx.arc(bx, by, 0.4 + s.z * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (tier === "static") draw(0);
    };

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / w - 0.5;
      pointer.ty = e.clientY / h - 0.5;
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const warping = warpRef.current > 0.02;
      if (!warping && t - last < 33) return; // ~30fps when idle
      last = t;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      draw(t);
    };

    resize();
    window.addEventListener("resize", resize);

    if (tier !== "static") {
      if (tier === "full") window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [tier, warpRef, originRef]);

  return (
    <motion.canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: tier === "static" ? 0 : 3, delay: tier === "static" ? 0 : 0.4, ease: "easeOut" }}
    />
  );
}

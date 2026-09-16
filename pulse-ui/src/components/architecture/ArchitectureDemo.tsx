import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SoftAurora from '@/bits/SoftAurora/SoftAurora';
import {
  ALIVE_THRESHOLD,
  BLUR_MAX,
  DEPTH_INTENSITY,
  DEPTH_SCALE,
  DEPTH_Y,
  IDLE_AMPLITUDE,
  IDLE_DURATION,
  IDLE_ROTATE,
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  INTRO,
  INTRO_FADE,
  LAYER_COPY,
  PIN_OFFSET_PX,
  SCROLL_VH,
  SOFT_AURORA_PROPS,
  STAGES,
} from './architectureConfig';
import './ArchitectureDemo.css';

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function copyOpacity(progress: number, range: readonly [number, number, number, number]) {
  const [a, b, c, d] = range;
  if (progress < a || progress > d) return 0;
  if (progress < b) return (progress - a) / Math.max(0.0001, b - a);
  if (progress <= c) return 1;
  return 1 - (progress - c) / Math.max(0.0001, d - c);
}

function introOpacity(progress: number) {
  const [, fadeStart, fadeEnd] = INTRO_FADE;
  if (progress < fadeStart) return 1;
  if (progress >= fadeEnd) return 0;
  return 1 - (progress - fadeStart) / Math.max(0.0001, fadeEnd - fadeStart);
}

/** Map scroll progress to stage blend weights.
 * 0–0.10: hold full assembly (stage 6).
 * Then rebuild foundation → Pulse across the remaining scroll.
 */
function stageWeights(progress: number, count: number): number[] {
  const max = count - 1;
  const weights = Array.from({ length: count }, () => 0);

  if (progress < 0.1) {
    weights[max] = 1;
    return weights;
  }

  const rebuild = (progress - 0.1) / 0.9;
  const t = Math.min(1, Math.max(0, rebuild)) * max;
  const i = Math.floor(t);
  const f = t - i;
  weights[i] = 1 - f;
  if (i + 1 < count) weights[i + 1] = f;
  else weights[i] = 1;
  return weights;
}

export function ArchitectureDemo() {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const idleRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [alive, setAlive] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const scrollEl = scrollRef.current;
    const pinEl = pinRef.current;
    const idleEl = idleRef.current;
    if (!scrollEl || !pinEl || !idleEl) return;

    let idleTween: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: scrollEl,
        start: `top ${PIN_OFFSET_PX}px`,
        end: 'bottom bottom',
        pin: pinEl,
        scrub: 0.65,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setProgress(p);
          setAlive(p >= ALIVE_THRESHOLD);
          const nearRest = p < 0.06 || p > 0.92;
          if (idleTween) {
            if (nearRest) idleTween.play();
            else idleTween.pause();
          }
        },
      });

      idleTween = gsap.to(idleEl, {
        y: IDLE_AMPLITUDE,
        rotate: IDLE_ROTATE,
        duration: IDLE_DURATION,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, scrollEl);

    return () => {
      idleTween?.kill();
      ctx.revert();
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const depthEl = depthRef.current;
    if (!depthEl) return;

    const intensity = DEPTH_INTENSITY;
    const y = Math.sin(progress * Math.PI) * DEPTH_Y * intensity;
    const scale = 1 + Math.sin(progress * Math.PI) * DEPTH_SCALE * intensity;
    const blur =
      progress > 0.1 && progress < 0.96
        ? Math.sin(((progress - 0.1) / 0.9) * Math.PI) * BLUR_MAX * intensity
        : 0;

    gsap.set(depthEl, {
      y,
      scale,
      filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none',
      force3D: true,
    });
  }, [progress, reduced]);

  const weights = useMemo(
    () =>
      reduced
        ? STAGES.map((_, i) => (i === STAGES.length - 1 ? 1 : 0))
        : stageWeights(progress, STAGES.length),
    [progress, reduced]
  );

  const auroraSpeed = reduced ? 0 : SOFT_AURORA_PROPS.speed;

  return (
    <div className={`arch-demo${alive ? ' is-alive' : ''}`}>
      <div className="pulse-aurora" aria-hidden>
        <SoftAurora {...SOFT_AURORA_PROPS} speed={auroraSpeed} />
      </div>

      <div
        className="arch-scroll"
        ref={scrollRef}
        style={{ height: reduced ? 'auto' : `${SCROLL_VH}vh` }}
      >
        <div className="arch-pin" ref={pinRef}>
          <header
            className="arch-intro"
            style={{ opacity: reduced ? 1 : introOpacity(progress) }}
          >
            <h1>{INTRO.headline}</h1>
            <p>{INTRO.subline}</p>
          </header>

          <div className="arch-depth" ref={depthRef}>
            <div className="arch-stage-wrap" ref={idleRef}>
              {STAGES.map((stage, i) => (
                <img
                  key={stage.id}
                  src={stage.src}
                  alt=""
                  width={IMAGE_WIDTH}
                  height={IMAGE_HEIGHT}
                  decoding={i === 0 || i === STAGES.length - 1 ? 'sync' : 'async'}
                  fetchPriority={i === STAGES.length - 1 || i < 2 ? 'high' : 'low'}
                  className={weights[i] > 0.02 ? 'is-active' : undefined}
                  style={{ opacity: weights[i] }}
                  draggable={false}
                />
              ))}
            </div>
          </div>

          <div className="arch-copy" aria-live="polite">
            {LAYER_COPY.map((item) => {
              const opacity = reduced ? 1 : copyOpacity(progress, item.range);
              return (
                <div
                  key={item.id}
                  className="arch-copy-item"
                  data-id={item.id}
                  data-side={item.side}
                  style={{
                    opacity,
                    transform: reduced ? undefined : `translateY(${(1 - opacity) * 10}px)`,
                  }}
                >
                  <p className="arch-copy-title">{item.title}</p>
                  <p className="arch-copy-body">{item.body}</p>
                </div>
              );
            })}
          </div>

          {!reduced && progress < 0.08 ? (
            <div className="arch-hint" style={{ opacity: 1 - progress / 0.08 }}>
              Scroll to explore
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

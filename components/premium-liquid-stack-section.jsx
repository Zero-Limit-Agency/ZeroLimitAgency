"use client";

import { useMemo, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const defaultLayers = [
  {
    label: "01",
    title: "Titre modifiable",
    subtitle: "Sous-titre modifiable",
    description: "Description courte modifiable."
  },
  {
    label: "02",
    title: "Titre modifiable",
    subtitle: "Sous-titre modifiable",
    description: "Description courte modifiable."
  },
  {
    label: "03",
    title: "Titre modifiable",
    subtitle: "Sous-titre modifiable",
    description: "Description courte modifiable."
  },
  {
    label: "04",
    title: "Titre modifiable",
    subtitle: "Sous-titre modifiable",
    description: "Description courte modifiable."
  }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function PremiumLiquidStackSection({
  items = defaultLayers,
  heading = "Objet premium modifiable",
  intro = "Un bloc interactif pour présenter un contenu évolutif, avec un rendu 3D sobre, brillant et facilement personnalisable."
}) {
  const safeItems = useMemo(
    () => (Array.isArray(items) && items.length ? items : defaultLayers).slice(0, 6),
    [items]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const rotateX = useMotionValue(-10);
  const rotateY = useMotionValue(-14);
  const springRotateX = useSpring(rotateX, { stiffness: 85, damping: 18, mass: 0.85 });
  const springRotateY = useSpring(rotateY, { stiffness: 85, damping: 18, mass: 0.85 });

  const activeItem = safeItems[activeIndex] || safeItems[0];

  function handlePointerMove(event) {
    if (window.innerWidth <= 900) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - bounds.left) / bounds.width;
    const ratioY = (event.clientY - bounds.top) / bounds.height;

    rotateY.set(clamp(-15 + ratioX * 30, -18, 18));
    rotateX.set(clamp(-12 + ratioY * 14, -16, 10));
  }

  function resetTilt() {
    rotateX.set(-10);
    rotateY.set(-14);
  }

  function handleDrag(_, info) {
    if (window.innerWidth <= 900) {
      return;
    }

    rotateY.set(clamp(rotateY.get() + info.delta.x * 0.12, -18, 18));
    rotateX.set(clamp(rotateX.get() - info.delta.y * 0.08, -16, 10));
  }

  return (
    <div className="premium-stack">
      <div className="premium-stack-copy">
        <p className="premium-stack-kicker">Build your dream without limit.</p>
        <h2>{heading}</h2>
        <p>{intro}</p>
      </div>

      <div className="premium-stack-scene">
        <div
          className="premium-stack-perspective"
          onMouseMove={handlePointerMove}
          onMouseLeave={resetTilt}
        >
          <motion.div
            className="premium-stack-rig"
            drag
            dragElastic={0.08}
            dragMomentum={false}
            onDrag={handleDrag}
            onDragEnd={resetTilt}
            style={{
              rotateX: springRotateX,
              rotateY: springRotateY,
              transformStyle: "preserve-3d"
            }}
          >
            <div className="premium-stack-halo" aria-hidden="true" />

            {safeItems.map((item, index) => {
              const isActive = index === activeIndex;
              const total = safeItems.length;
              const topOffset = index * 5.15;
              const depth = -index * 14;

              return (
                <motion.button
                  key={`${item.label}-${index}`}
                  type="button"
                  className={`premium-layer${isActive ? " is-active" : ""}`}
                  style={{
                    top: `${topOffset}rem`,
                    transform: `translateZ(${depth}px)`,
                    zIndex: total - index
                  }}
                  whileHover={{
                    y: -4,
                    z: depth + 26
                  }}
                  transition={{ type: "spring", stiffness: 170, damping: 18 }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  aria-label={`${item.label} ${item.title}`}
                >
                  <span className="premium-layer-sheen" aria-hidden="true" />
                  <span className="premium-layer-outline" aria-hidden="true" />
                  <span className="premium-layer-shadow" aria-hidden="true" />
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          key={`${activeItem?.label}-${activeIndex}`}
          className="premium-stack-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <small>{activeItem?.label || "01"}</small>
          <strong>{activeItem?.title || "Titre modifiable"}</strong>
          <span>{activeItem?.subtitle || "Sous-titre modifiable"}</span>
          <p>{activeItem?.description || "Description courte modifiable."}</p>
        </motion.div>
      </div>

      <style jsx>{`
        .premium-stack {
          display: grid;
          gap: 1.5rem;
          width: 100%;
          min-width: 0;
        }

        .premium-stack-copy {
          display: grid;
          gap: 0.8rem;
          max-width: 28rem;
        }

        .premium-stack-kicker {
          margin: 0;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 245, 243, 0.64);
        }

        .premium-stack-copy :global(h2) {
          margin: 0;
          font-size: clamp(1.8rem, 2.8vw, 2.8rem);
          line-height: 0.96;
          letter-spacing: -0.04em;
        }

        .premium-stack-copy p:last-child {
          margin: 0;
          color: rgba(255, 245, 243, 0.78);
          line-height: 1.72;
        }

        .premium-stack-scene {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(230px, 0.7fr);
          gap: 1.4rem;
          align-items: center;
        }

        .premium-stack-perspective {
          position: relative;
          min-height: 30rem;
          perspective: 1800px;
        }

        .premium-stack-rig {
          position: relative;
          width: 100%;
          height: 30rem;
          cursor: grab;
          user-select: none;
        }

        .premium-stack-rig:active {
          cursor: grabbing;
        }

        .premium-stack-halo {
          position: absolute;
          inset: 2rem 1rem 0;
          border-radius: 3rem;
          background:
            radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.2), transparent 24%),
            radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.08), transparent 34%),
            radial-gradient(circle at 50% 100%, rgba(240, 138, 184, 0.12), transparent 28%);
          filter: blur(26px);
          opacity: 0.85;
          pointer-events: none;
        }

        .premium-layer {
          position: absolute;
          left: 10%;
          width: 80%;
          height: 4.8rem;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.02) 36%, rgba(255, 255, 255, 0.01) 70%, rgba(255, 255, 255, 0.08)),
            linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03) 42%, rgba(8, 8, 10, 0.58) 100%);
          backdrop-filter: blur(18px) saturate(140%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            inset 0 -16px 24px rgba(0, 0, 0, 0.22),
            0 18px 42px rgba(0, 0, 0, 0.24);
          transition:
            filter 220ms ease,
            background 220ms ease,
            box-shadow 220ms ease;
          overflow: hidden;
          outline: none;
        }

        .premium-layer.is-active,
        .premium-layer:hover,
        .premium-layer:focus-visible {
          filter: brightness(1.12);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -18px 28px rgba(0, 0, 0, 0.18),
            0 24px 56px rgba(0, 0, 0, 0.28);
        }

        .premium-layer-sheen,
        .premium-layer-outline,
        .premium-layer-shadow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        .premium-layer-sheen {
          background:
            linear-gradient(98deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 24%, rgba(255, 255, 255, 0.02) 52%, rgba(255, 255, 255, 0.12) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 28%, rgba(0, 0, 0, 0.18) 100%);
          opacity: 0.88;
        }

        .premium-layer-outline {
          inset: 1px;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .premium-layer-shadow {
          inset: auto 10% -1rem;
          height: 1rem;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.46));
          filter: blur(8px);
          opacity: 0.48;
        }

        .premium-stack-panel {
          display: grid;
          gap: 0.5rem;
          padding: 1.15rem 1.15rem 1.2rem;
          border-radius: 1.6rem;
          border: 1px solid rgba(255, 245, 243, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
            rgba(18, 10, 13, 0.78);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(16px);
        }

        .premium-stack-panel small {
          color: rgba(255, 245, 243, 0.52);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.72rem;
        }

        .premium-stack-panel strong {
          color: #fff8f4;
          font-size: 1.18rem;
        }

        .premium-stack-panel span {
          color: rgba(255, 245, 243, 0.54);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 0.74rem;
        }

        .premium-stack-panel p {
          margin: 0.1rem 0 0;
          color: rgba(255, 245, 243, 0.78);
          line-height: 1.65;
        }

        @media (max-width: 1180px) {
          .premium-stack-copy {
            max-width: none;
          }

          .premium-stack-scene {
            grid-template-columns: 1fr;
          }

          .premium-stack-panel {
            max-width: 28rem;
          }
        }

        @media (max-width: 900px) {
          .premium-stack-perspective {
            min-height: 26rem;
          }

          .premium-stack-rig {
            height: 26rem;
            transform: none !important;
          }

          .premium-layer {
            left: 8%;
            width: 84%;
            height: 4.25rem;
          }
        }

        @media (max-width: 640px) {
          .premium-stack {
            gap: 1.15rem;
          }

          .premium-stack-copy :global(h2) {
            font-size: 1.7rem;
          }

          .premium-stack-perspective {
            min-height: 22rem;
          }

          .premium-stack-rig {
            height: 22rem;
          }

          .premium-layer {
            left: 4%;
            width: 92%;
            height: 3.6rem;
          }

          .premium-stack-panel {
            padding: 1rem;
            border-radius: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}

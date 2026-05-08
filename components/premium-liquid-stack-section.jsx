"use client";

import { useMemo, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const defaultLayers = [
  {
    label: "01",
    title: "Titre modifiable",
    subtitle: "Label modifiable",
    description: "Description courte modifiable."
  },
  {
    label: "02",
    title: "Titre modifiable",
    subtitle: "Label modifiable",
    description: "Description courte modifiable."
  },
  {
    label: "03",
    title: "Titre modifiable",
    subtitle: "Label modifiable",
    description: "Description courte modifiable."
  },
  {
    label: "04",
    title: "Titre modifiable",
    subtitle: "Label modifiable",
    description: "Description courte modifiable."
  }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function PremiumLiquidStackSection({
  items = defaultLayers,
  heading = "Objet premium modifiable",
  intro = "Description modifiable."
}) {
  const safeItems = useMemo(
    () => (Array.isArray(items) && items.length ? items : defaultLayers).slice(0, 6),
    [items]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const rotateX = useMotionValue(-8);
  const rotateY = useMotionValue(-10);
  const springRotateX = useSpring(rotateX, { stiffness: 90, damping: 18, mass: 0.85 });
  const springRotateY = useSpring(rotateY, { stiffness: 90, damping: 18, mass: 0.85 });

  const activeItem = safeItems[activeIndex] || safeItems[0];

  function handlePointerMove(event) {
    if (typeof window !== "undefined" && window.innerWidth <= 920) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - bounds.left) / bounds.width;
    const ratioY = (event.clientY - bounds.top) / bounds.height;

    rotateY.set(clamp(-12 + ratioX * 24, -14, 14));
    rotateX.set(clamp(-10 + ratioY * 12, -12, 10));
  }

  function resetTilt() {
    rotateX.set(-8);
    rotateY.set(-10);
  }

  function handleDrag(_, info) {
    if (typeof window !== "undefined" && window.innerWidth <= 920) {
      return;
    }

    rotateY.set(clamp(rotateY.get() + info.delta.x * 0.08, -14, 14));
    rotateX.set(clamp(rotateX.get() - info.delta.y * 0.06, -12, 10));
  }

  return (
    <div className="premium-stack">
      <div className="premium-stack-copy">
        <p className="premium-stack-kicker">Build your dream without limit.</p>
        <h2>{heading}</h2>
        <p>{intro}</p>
      </div>

      <div className="premium-stack-layout">
        <div
          className="premium-stack-viewport"
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
            <div className="premium-stack-aura" aria-hidden="true" />

            {safeItems.map((item, index) => {
              const gap = 4.3;
              const top = index * gap;
              const z = -index * 16;
              const isActive = activeIndex === index;

              return (
                <motion.button
                  key={`${item.label}-${index}`}
                  type="button"
                  className={`premium-stack-layer${isActive ? " is-active" : ""}`}
                  style={{
                    top: `${top}rem`,
                    transform: `translateZ(${z}px)`
                  }}
                  whileHover={{
                    y: -4,
                    z: z + 24
                  }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  aria-label={`${item.label} ${item.title}`}
                >
                  <span className="premium-stack-layer-fill" aria-hidden="true" />
                  <span className="premium-stack-layer-gloss" aria-hidden="true" />
                  <span className="premium-stack-layer-outline" aria-hidden="true" />
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          key={`${activeItem?.label}-${activeIndex}`}
          className="premium-stack-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <small>{activeItem?.label || "01"}</small>
          <strong>{activeItem?.title || "Titre modifiable"}</strong>
          <span>{activeItem?.subtitle || "Label modifiable"}</span>
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
          gap: 0.85rem;
          max-width: 33rem;
        }

        .premium-stack-kicker {
          margin: 0;
          font-size: 0.8rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 245, 243, 0.62);
        }

        .premium-stack-copy :global(h2) {
          margin: 0;
          font-size: clamp(2rem, 3vw, 3rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
          max-width: 12ch;
        }

        .premium-stack-copy p:last-child {
          margin: 0;
          color: rgba(255, 245, 243, 0.78);
          line-height: 1.72;
          max-width: 35rem;
        }

        .premium-stack-layout {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(240px, 0.72fr);
          gap: 2rem;
          align-items: center;
          min-width: 0;
        }

        .premium-stack-viewport {
          position: relative;
          min-height: 22.5rem;
          perspective: 2000px;
        }

        .premium-stack-rig {
          position: relative;
          width: 100%;
          height: 22.5rem;
          cursor: grab;
          user-select: none;
        }

        .premium-stack-rig:active {
          cursor: grabbing;
        }

        .premium-stack-aura {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.16), transparent 22%),
            radial-gradient(circle at 50% 92%, rgba(212, 170, 106, 0.12), transparent 28%);
          filter: blur(24px);
          opacity: 0.85;
          pointer-events: none;
        }

        .premium-stack-layer {
          position: absolute;
          left: 10%;
          width: 78%;
          height: 3.35rem;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: transparent;
          outline: none;
          transition: filter 220ms ease;
        }

        .premium-stack-layer.is-active,
        .premium-stack-layer:hover,
        .premium-stack-layer:focus-visible {
          filter: brightness(1.12);
        }

        .premium-stack-layer-fill,
        .premium-stack-layer-gloss,
        .premium-stack-layer-outline {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        .premium-stack-layer-fill {
          background:
            linear-gradient(100deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 34%, rgba(255, 255, 255, 0.01) 68%, rgba(255, 255, 255, 0.08) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(19, 17, 20, 0.46) 44%, rgba(5, 5, 7, 0.74) 100%);
          backdrop-filter: blur(20px) saturate(120%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            inset 0 -10px 24px rgba(0, 0, 0, 0.22),
            0 18px 32px rgba(0, 0, 0, 0.18);
          opacity: 0.92;
        }

        .premium-stack-layer-gloss {
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.16) 18%, rgba(255, 255, 255, 0.02) 44%, rgba(255, 255, 255, 0.02) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 34%);
          mix-blend-mode: screen;
          opacity: 0.82;
        }

        .premium-stack-layer-outline {
          inset: 1px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .premium-stack-layer.is-active .premium-stack-layer-fill,
        .premium-stack-layer:hover .premium-stack-layer-fill,
        .premium-stack-layer:focus-visible .premium-stack-layer-fill {
          background:
            linear-gradient(100deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.08) 34%, rgba(255, 255, 255, 0.02) 68%, rgba(255, 255, 255, 0.12) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(19, 17, 20, 0.44) 44%, rgba(6, 6, 8, 0.7) 100%);
        }

        .premium-stack-layer.is-active .premium-stack-layer-outline,
        .premium-stack-layer:hover .premium-stack-layer-outline,
        .premium-stack-layer:focus-visible .premium-stack-layer-outline {
          border-color: rgba(255, 255, 255, 0.28);
        }

        .premium-stack-panel {
          display: grid;
          gap: 0.48rem;
          padding: 1.2rem 1.25rem;
          border-radius: 1.7rem;
          border: 1px solid rgba(255, 245, 243, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
            rgba(19, 12, 15, 0.7);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(14px);
        }

        .premium-stack-panel small {
          color: rgba(255, 245, 243, 0.52);
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .premium-stack-panel strong {
          font-size: 1.3rem;
          color: #fff7f2;
        }

        .premium-stack-panel span {
          color: rgba(255, 245, 243, 0.5);
          font-size: 0.76rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .premium-stack-panel p {
          margin: 0.2rem 0 0;
          color: rgba(255, 245, 243, 0.78);
          line-height: 1.7;
        }

        @media (max-width: 1180px) {
          .premium-stack-layout {
            grid-template-columns: 1fr;
            gap: 1.35rem;
          }

          .premium-stack-panel {
            max-width: 30rem;
          }
        }

        @media (max-width: 920px) {
          .premium-stack-copy {
            max-width: none;
          }

          .premium-stack-copy :global(h2) {
            max-width: none;
          }

          .premium-stack-viewport {
            min-height: 20.5rem;
          }

          .premium-stack-rig {
            height: 20.5rem;
            transform: none !important;
          }

          .premium-stack-layer {
            left: 8%;
            width: 84%;
          }
        }

        @media (max-width: 640px) {
          .premium-stack {
            gap: 1.15rem;
          }

          .premium-stack-copy :global(h2) {
            font-size: 1.85rem;
          }

          .premium-stack-viewport {
            min-height: 18.5rem;
          }

          .premium-stack-rig {
            height: 18.5rem;
          }

          .premium-stack-layer {
            left: 4%;
            width: 92%;
            height: 3rem;
          }

          .premium-stack-panel {
            padding: 1rem 1.05rem;
            border-radius: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}

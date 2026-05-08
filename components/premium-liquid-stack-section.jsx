"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const defaultLayers = [
  {
    label: "01",
    title: "Titre modifiable",
    subtitle: "Étape 1",
    description: "Description courte modifiable."
  },
  {
    label: "02",
    title: "Titre modifiable",
    subtitle: "Étape 2",
    description: "Description courte modifiable."
  },
  {
    label: "03",
    title: "Titre modifiable",
    subtitle: "Étape 3",
    description: "Description courte modifiable."
  },
  {
    label: "04",
    title: "Titre modifiable",
    subtitle: "Étape 4",
    description: "Description courte modifiable."
  }
];

export default function PremiumLiquidStackSection({
  items = defaultLayers,
  heading = "Objet premium modifiable",
  intro = "Description modifiable."
}) {
  const safeItems = useMemo(
    () => (Array.isArray(items) && items.length ? items : defaultLayers).slice(0, 4),
    [items]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = safeItems[activeIndex] || safeItems[0];

  return (
    <div className="premium-stack">
      <div className="premium-stack-copy">
        <p className="premium-stack-kicker">Build your dream without limit.</p>
        <h2>{heading}</h2>
        <p>{intro}</p>
      </div>

      <div className="premium-stack-shell">
        <div className="premium-stack-layers" aria-label="Évolution du projet">
          {safeItems.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <motion.button
                key={`${item.label}-${index}`}
                type="button"
                className={`premium-stack-layer${isActive ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                whileHover={{ scale: 1.045 }}
                whileTap={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                aria-label={`${item.subtitle || `Étape ${index + 1}`} ${item.title}`}
              >
                <span className="premium-stack-layer-fill" aria-hidden="true" />
                <span className="premium-stack-layer-gloss" aria-hidden="true" />
                <span className="premium-stack-layer-outline" aria-hidden="true" />
              </motion.button>
            );
          })}
        </div>

        <motion.div
          key={`${activeItem?.label}-${activeIndex}`}
          className="premium-stack-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <span className="premium-stack-panel-label">L'évolution de votre projet</span>
          <small>{activeItem?.subtitle || `Étape ${activeIndex + 1}`}</small>
          <strong>{activeItem?.title || "Titre modifiable"}</strong>
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

        .premium-stack-shell {
          display: grid;
          gap: 1.2rem;
          min-width: 0;
        }

        .premium-stack-layers {
          display: grid;
          gap: 0.95rem;
          padding: 0.35rem 0.25rem 0;
          width: 100%;
        }

        .premium-stack-layer {
          position: relative;
          display: block;
          width: 100%;
          height: 4.3rem;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: transparent;
          outline: none;
          cursor: pointer;
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
            linear-gradient(90deg, rgba(255, 244, 244, 0.92) 0%, rgba(255, 126, 102, 0.7) 18%, rgba(179, 15, 24, 0.88) 44%, rgba(35, 16, 25, 0.94) 82%, rgba(9, 8, 13, 0.98) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.18));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            inset 0 -12px 22px rgba(0, 0, 0, 0.22),
            0 18px 34px rgba(0, 0, 0, 0.24),
            0 0 28px rgba(255, 54, 54, 0.12);
          opacity: 0.94;
        }

        .premium-stack-layer-gloss {
          background:
            linear-gradient(98deg, rgba(255, 255, 255, 0.84) 0%, rgba(255, 255, 255, 0.2) 16%, rgba(255, 255, 255, 0.03) 42%, rgba(255, 255, 255, 0) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 34%);
          mix-blend-mode: screen;
          opacity: 0.95;
        }

        .premium-stack-layer-outline {
          inset: 1px;
          border: 1px solid rgba(255, 249, 246, 0.56);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.08),
            0 0 14px rgba(255, 232, 232, 0.16);
        }

        .premium-stack-layer.is-active .premium-stack-layer-fill,
        .premium-stack-layer:hover .premium-stack-layer-fill,
        .premium-stack-layer:focus-visible .premium-stack-layer-fill {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.34),
            inset 0 -12px 22px rgba(0, 0, 0, 0.16),
            0 24px 44px rgba(0, 0, 0, 0.28),
            0 0 34px rgba(255, 70, 70, 0.18);
          opacity: 1;
        }

        .premium-stack-layer.is-active .premium-stack-layer-outline,
        .premium-stack-layer:hover .premium-stack-layer-outline,
        .premium-stack-layer:focus-visible .premium-stack-layer-outline {
          border-color: rgba(255, 252, 250, 0.72);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.12),
            0 0 18px rgba(255, 236, 236, 0.2);
        }

        .premium-stack-panel {
          display: grid;
          gap: 0.45rem;
          width: 100%;
          padding: 1.15rem 1.2rem;
          border-radius: 1.6rem;
          border: 1px solid rgba(255, 245, 243, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025)),
            rgba(18, 10, 13, 0.7);
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.16);
          backdrop-filter: blur(14px);
        }

        .premium-stack-panel-label {
          display: block;
          color: rgba(255, 245, 243, 0.52);
          font-size: 0.76rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .premium-stack-panel small {
          display: block;
          color: rgba(255, 214, 214, 0.78);
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .premium-stack-panel strong {
          display: block;
          color: #fff8f4;
          font-size: 1.3rem;
        }

        .premium-stack-panel p {
          margin: 0.15rem 0 0;
          color: rgba(255, 245, 243, 0.78);
          line-height: 1.68;
        }

        @media (max-width: 920px) {
          .premium-stack-copy {
            max-width: none;
          }

          .premium-stack-copy :global(h2) {
            max-width: none;
          }
        }

        @media (max-width: 640px) {
          .premium-stack {
            gap: 1.1rem;
          }

          .premium-stack-copy :global(h2) {
            font-size: 1.85rem;
          }

          .premium-stack-layer {
            height: 3.8rem;
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

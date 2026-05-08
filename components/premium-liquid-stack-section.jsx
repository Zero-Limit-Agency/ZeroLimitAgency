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

export default function PremiumLiquidStackSection({ items = defaultLayers }) {
  const safeItems = useMemo(
    () => (Array.isArray(items) && items.length ? items : defaultLayers).slice(0, 4),
    [items]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = safeItems[activeIndex] || safeItems[0];

  return (
    <div className="premium-stack">
      <div className="premium-stack-grid">
        <div className="premium-stack-steps" aria-label="Étapes du projet">
          {safeItems.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <motion.button
                key={`${item.label}-${index}`}
                type="button"
                className={`premium-stack-step${isActive ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <span className="premium-stack-step-glow" aria-hidden="true" />
                <span className="premium-stack-step-shine" aria-hidden="true" />
                <span className="premium-stack-step-outline" aria-hidden="true" />
                <span className="premium-stack-step-index">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          key={`${activeItem?.label}-${activeIndex}`}
          className="premium-stack-info"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <span className="premium-stack-info-kicker">L'évolution de votre projet</span>
          <small>{activeItem?.subtitle || `Étape ${activeIndex + 1}`}</small>
          <strong>{activeItem?.title || "Titre modifiable"}</strong>
          <p>{activeItem?.description || "Description courte modifiable."}</p>
        </motion.div>
      </div>

      <style jsx>{`
        .premium-stack {
          width: 100%;
          min-width: 0;
        }

        .premium-stack-grid {
          display: grid;
          gap: 1.35rem;
          align-items: start;
        }

        .premium-stack-steps {
          display: grid;
          gap: 0.9rem;
          width: 100%;
        }

        .premium-stack-step {
          position: relative;
          display: block;
          width: 100%;
          height: 4.4rem;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: transparent;
          cursor: pointer;
          overflow: hidden;
          outline: none;
        }

        .premium-stack-step-glow,
        .premium-stack-step-shine,
        .premium-stack-step-outline {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        .premium-stack-step-glow {
          background:
            linear-gradient(90deg, rgba(255, 246, 242, 0.96) 0%, rgba(255, 154, 128, 0.82) 18%, rgba(194, 18, 29, 0.92) 48%, rgba(43, 22, 31, 0.92) 82%, rgba(12, 8, 14, 0.98) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.18));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.26),
            inset 0 -12px 18px rgba(0, 0, 0, 0.2),
            0 14px 30px rgba(0, 0, 0, 0.22),
            0 0 18px rgba(255, 72, 72, 0.12);
        }

        .premium-stack-step-shine {
          background:
            linear-gradient(102deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.24) 16%, rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 36%);
          mix-blend-mode: screen;
          opacity: 0.94;
        }

        .premium-stack-step-outline {
          inset: 1px;
          border: 1px solid rgba(255, 250, 247, 0.58);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 0 12px rgba(255, 232, 232, 0.14);
        }

        .premium-stack-step-index {
          position: absolute;
          left: 1.15rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
          color: rgba(255, 250, 247, 0.88);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.18em;
        }

        .premium-stack-step.is-active .premium-stack-step-glow,
        .premium-stack-step:hover .premium-stack-step-glow,
        .premium-stack-step:focus-visible .premium-stack-step-glow {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.34),
            inset 0 -12px 18px rgba(0, 0, 0, 0.14),
            0 18px 36px rgba(0, 0, 0, 0.24),
            0 0 24px rgba(255, 86, 86, 0.16);
        }

        .premium-stack-step.is-active .premium-stack-step-outline,
        .premium-stack-step:hover .premium-stack-step-outline,
        .premium-stack-step:focus-visible .premium-stack-step-outline {
          border-color: rgba(255, 252, 250, 0.74);
        }

        .premium-stack-info {
          display: grid;
          gap: 0.45rem;
          width: 100%;
          padding: 1.15rem 1.2rem;
          border-radius: 1.4rem;
          border: 1px solid rgba(255, 245, 243, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
            rgba(23, 12, 16, 0.64);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.16);
          backdrop-filter: blur(14px);
        }

        .premium-stack-info-kicker,
        .premium-stack-info small {
          display: block;
        }

        .premium-stack-info-kicker {
          color: rgba(255, 245, 243, 0.52);
          font-size: 0.76rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .premium-stack-info small {
          color: rgba(255, 217, 217, 0.84);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .premium-stack-info strong {
          display: block;
          color: #fff8f4;
          font-size: 1.28rem;
        }

        .premium-stack-info p {
          margin: 0.15rem 0 0;
          color: rgba(255, 245, 243, 0.8);
          line-height: 1.68;
        }

        @media (max-width: 640px) {
          .premium-stack-step {
            height: 4rem;
          }

          .premium-stack-info {
            padding: 1rem 1.05rem;
          }
        }
      `}</style>
    </div>
  );
}

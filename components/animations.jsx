"use client";

import { useEffect, useRef, useState } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function useRevealOnce({ rootMargin = "0px 0px -12% 0px", threshold = 0.12 } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node || isVisible) {
      return undefined;
    }

    if (typeof window === "undefined" || window.matchMedia(reducedMotionQuery).matches) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin, threshold]);

  return { ref, isVisible };
}

export function AnimatedSection({ as: Component = "section", className = "", children, ...props }) {
  const { ref, isVisible } = useRevealOnce({ threshold: 0.08 });

  return (
    <Component ref={ref} className={`${className} animated-section${isVisible ? " is-visible" : ""}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export function MotionReveal({ as: Component = "div", variant = "slide-up", delay = 0, className = "", children, ...props }) {
  const { ref, isVisible } = useRevealOnce();

  return (
    <Component
      ref={ref}
      className={`${className} motion-reveal motion-${variant}${isVisible ? " is-visible" : ""}`.trim()}
      style={{ "--motion-delay": `${delay}ms` }}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerContainer({ as: Component = "div", className = "", children, delay = 0, ...props }) {
  const { ref, isVisible } = useRevealOnce();

  return (
    <Component
      ref={ref}
      className={`${className} stagger-container${isVisible ? " is-visible" : ""}`.trim()}
      style={{ "--stagger-start": `${delay}ms` }}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ as: Component = "div", className = "", index = 0, children, ...props }) {
  return (
    <Component
      className={`${className} stagger-item`.trim()}
      style={{ "--stagger-index": index }}
      {...props}
    >
      {children}
    </Component>
  );
}

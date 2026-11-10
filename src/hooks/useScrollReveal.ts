import { useEffect, useRef } from "react";

/** Reveals marked sections as they enter the viewport. */
export default function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = root.querySelectorAll<HTMLElement>("[data-scroll-reveal]");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    root.classList.add("scroll-reveal-enabled");
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      root.classList.remove("scroll-reveal-enabled");
    };
  }, []);

  return ref;
}

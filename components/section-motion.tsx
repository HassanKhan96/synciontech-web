"use client";

import { useEffect } from "react";

export function SectionMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll("[data-reveal], .section-heading, .sigbyte-panel, .khata-panel, .connected-copy, .people-system, .solutions-top, .outcomes-grid article, .about-grid, .contact-grid");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add("scroll-reveal");
        observer.observe(element);
      }
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove("scroll-reveal"));
    };
  }, []);
  return null;
}

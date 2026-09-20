"use client";

import { useState } from "react";
import { AppWindow, Blocks, Cloud, Globe2, Pause, Play } from "lucide-react";
import styles from "./ecosystem-visual.module.css";

const nodes = [
  { label: "Web & mobile", detail: "Apps for your customers", icon: Globe2 },
  { label: "Business systems", detail: "Connect your operations", icon: Blocks },
  { label: "Cloud & devices", detail: "Platforms and embedded software", icon: Cloud },
  { label: "Desktop apps", detail: "Tools for your team", icon: AppWindow },
];

export function EcosystemVisual() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="ecosystem-visual ecosystem-refined">
      <div className="diagram-caption"><span>WHAT WE BUILD</span><span>Software for your business</span></div>
      <div className={styles.stage} data-paused={paused} aria-label="Syncion software development services">
        <div className={styles.track} aria-hidden="true" />
        <div className={styles.innerTrack} aria-hidden="true" />
        <div className={styles.core}>
          <img src="/Syncion Logo-selection.png" alt="" width="68" height="42" />
          <span>Syncion</span>
        </div>
        <ul className={styles.orbit} aria-label="Development services">
          {nodes.map(({ label, detail, icon: Icon }, index) => (
            <li className={styles.position} data-position={index} key={label}>
              <div className={styles.card}>
                <Icon size={20} aria-hidden="true" />
                <strong>{label}</strong>
                <small>{detail}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.footer}>
        <span>Built around your business.</span>
        <button type="button" className={styles.control} onClick={() => setPaused(!paused)} aria-label={paused ? "Resume orbit animation" : "Pause orbit animation"} aria-pressed={paused}>
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  );
}

/* eslint-disable react/no-unknown-property */
import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Torus } from "@react-three/drei";

const h = React.createElement;

function OrbitRing({ radius, tube, color, speedX, speedY, opacity = 0.8 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = t * speedX;
    ref.current.rotation.y = t * speedY;
  });
  return h(Torus, { ref, args: [radius, tube, 16, 100] },
    h("meshStandardMaterial", {
      color, emissive: color, emissiveIntensity: 1.2,
      metalness: 0.8, roughness: 0.2, transparent: true, opacity,
    })
  );
}

export default function CountdownScene() {
  return h(Canvas, {
    dpr: [1, 1.5],
    camera: { position: [0, 0, 6], fov: 50 },
    gl: { antialias: true, alpha: true, powerPreference: "high-performance" },
    resize: { scroll: false, debounce: { scroll: 0, resize: 100 } },
    style: { background: "transparent", width: "100%", height: "100%", touchAction: "none" },
  },
    h("ambientLight", { intensity: 0.4 }),
    h("pointLight", { position: [3, 3, 3], intensity: 1.5, color: "#00F0FF" }),
    h("pointLight", { position: [-3, -3, 2], intensity: 1, color: "#7B61FF" }),
    h(Suspense, { fallback: null },
      h(OrbitRing, { radius: 2.2, tube: 0.015, color: "#00F0FF", speedX: 0.15, speedY: 0.25, opacity: 0.9 }),
      h(OrbitRing, { radius: 2.6, tube: 0.01, color: "#7B61FF", speedX: -0.1, speedY: 0.18, opacity: 0.7 }),
      h(OrbitRing, { radius: 3.0, tube: 0.008, color: "#00F0FF", speedX: 0.08, speedY: -0.12, opacity: 0.5 })
    )
  );
}

/* eslint-disable react/no-unknown-property */
// Three.js primitives are rendered via React.createElement so visual-edits
// babel plugin doesn't inject DOM source attrs that R3F can't apply.
import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron, Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";

const h = React.createElement;

function StreakFlame({ streak = 0 }) {
  const mesh = useRef();
  const intensity = Math.min(1, 0.25 + streak * 0.05);

  useFrame(({ clock, mouse }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    mesh.current.rotation.x = mouse.y * 0.3 + Math.sin(t * 0.3) * 0.1;
    mesh.current.rotation.y = mouse.x * 0.4 + t * 0.2;
  });

  const color = useMemo(() => {
    if (streak >= 30) return "#FFD400";
    if (streak >= 7) return "#FF6B00";
    if (streak >= 3) return "#00F0FF";
    return "#5C7A99";
  }, [streak]);

  return h(Float, { speed: 2, rotationIntensity: 0.6, floatIntensity: 1.2 },
    h(Icosahedron, { ref: mesh, args: [1.4, 1] },
      h(MeshDistortMaterial, {
        color, emissive: color, emissiveIntensity: intensity * 1.4,
        roughness: 0.15, metalness: 0.6, distort: 0.35, speed: 2,
      })
    ),
    h(Icosahedron, { args: [1.45, 1] },
      h("meshBasicMaterial", { color, wireframe: true, transparent: true, opacity: 0.18 })
    )
  );
}

export default function StreakScene({ streak = 0 }) {
  return h(Canvas, {
    dpr: [1, 1.5],
    camera: { position: [0, 0, 4.5], fov: 50 },
    gl: { antialias: true, alpha: true, powerPreference: "high-performance" },
    resize: { scroll: false, debounce: { scroll: 0, resize: 100 } },
    style: { background: "transparent", width: "100%", height: "100%", touchAction: "none" },
  },
    h("ambientLight", { intensity: 0.3 }),
    h("pointLight", { position: [5, 5, 5], intensity: 2, color: "#00F0FF" }),
    h("pointLight", { position: [-5, -3, 2], intensity: 1.5, color: "#7B61FF" }),
    h(Suspense, { fallback: null },
      h(StreakFlame, { streak }),
      h(Sparkles, {
        count: 50, scale: [6, 6, 4], size: 1.5, speed: 0.4,
        color: streak >= 7 ? "#FF6B00" : "#00F0FF", opacity: 0.6,
      })
    )
  );
}

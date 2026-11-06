import React, { useMemo } from "react";
import * as THREE from "three";

export const LIME = "#B6FF3B";
const holo = (c = LIME, i = 1.6) => ({ color: c, emissive: c, emissiveIntensity: i, transparent: true, opacity: 0.85, toneMapped: false });
const steel = { color: "#9aa3ad", metalness: 0.85, roughness: 0.3 } as const;
const darkSteel = { color: "#23282e", metalness: 0.8, roughness: 0.4 } as const;

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/* 01 Safine Twin — conveyor + holographic factory twin */
const Twin: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.85, -1.2]}>
      <boxGeometry args={[9, 0.18, 0.9]} />
      <meshStandardMaterial {...darkSteel} />
    </mesh>
    {Array.from({ length: 9 }).map((_, i) => {
      const x = ((i * 1.1 + t * 0.8) % 9.9) - 4.95;
      return (
        <mesh key={i} position={[x, -0.55, -1.2]} rotation={[0, i, 0]}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial color="#c8a46b" roughness={0.85} />
        </mesh>
      );
    })}
    <group position={[0, 1.95, -2.4]} scale={0.8} rotation={[0.35, t * 0.25, 0]}>
      {[[-0.7, 0, 0, 0.8, 0.6, 1.2], [0.4, 0.1, 0.2, 0.9, 0.8, 0.8], [0.2, -0.05, -0.8, 1.6, 0.5, 0.5], [1.1, 0.4, -0.3, 0.2, 1.4, 0.2]].map((b, i) => (
        <mesh key={i} position={[b[0], b[1] + b[4] / 2, b[2]]}>
          <boxGeometry args={[b[3], b[4], b[5]]} />
          <meshStandardMaterial {...holo(LIME, 1.2)} wireframe />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.56, 64]} />
        <meshStandardMaterial {...holo()} side={THREE.DoubleSide} />
      </mesh>
    </group>
    {[-3, 3].map((x) => (
      <mesh key={x} position={[x, 1, -3.5]}>
        <cylinderGeometry args={[0.18, 0.18, 5, 24]} />
        <meshStandardMaterial {...steel} />
      </mesh>
    ))}
  </group>
);

/* 02 Risk Kalkanı — globe + live line chart + shield ring */
const Risk: React.FC<{ t: number }> = ({ t }) => {
  const curve = useMemo(() => {
    const pts = Array.from({ length: 40 }).map((_, i) => new THREE.Vector3(-2.4 + i * 0.12, Math.sin(i * 0.55) * 0.25 + Math.sin(i * 0.17) * 0.4 + i * 0.012, 0));
    return new THREE.CatmullRomCurve3(pts);
  }, []);
  const prog = ease(t / 4);
  return (
    <group>
      <group position={[0, 2.0, -2.6]} scale={0.85} rotation={[0.2, t * 0.3, 0]}>
        <mesh>
          <sphereGeometry args={[1.05, 32, 20]} />
          <meshStandardMaterial {...holo("#5fd0ff", 0.9)} wireframe />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.0, 48, 48]} />
          <meshStandardMaterial color="#061420" metalness={0.5} roughness={0.4} transparent opacity={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 2.0, -2.6]} scale={0.85} rotation={[Math.PI / 2.4, 0, t * 0.5]}>
        <torusGeometry args={[1.5, 0.02, 12, 120, Math.PI * 2 * prog]} />
        <meshStandardMaterial {...holo()} />
      </mesh>
      <group position={[0, 0.4, -1.6]} scale={[0.8, 0.8, 0.8]}>
        <mesh>
          <tubeGeometry args={[curve, Math.max(2, Math.floor(120 * prog)), 0.025, 8, false]} />
          <meshStandardMaterial {...holo()} />
        </mesh>
      </group>
    </group>
  );
};

/* 03 Banka Limit — marble columns + orbiting cards */
const Bank: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {[-2.6, -1.3, 1.3, 2.6].map((x) => (
      <group key={x} position={[x, 0.9, -3.2]}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.32, 4.2, 32]} />
          <meshStandardMaterial color="#d9d4cc" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, 2.15, 0]}>
          <boxGeometry args={[0.8, 0.18, 0.8]} />
          <meshStandardMaterial color="#d9d4cc" roughness={0.35} />
        </mesh>
      </group>
    ))}
    {Array.from({ length: 6 }).map((_, i) => {
      const a = (i / 6) * Math.PI * 2 + t * 0.45;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.55, 1.0 + Math.sin(a * 2) * 0.15, Math.sin(a) * 1.55 - 0.3]} rotation={[0.2, -a + Math.PI / 2, 0.1]}>
          <boxGeometry args={[0.62, 0.39, 0.015]} />
          <meshStandardMaterial color={i % 2 ? "#1d2a24" : "#c9d2da"} metalness={0.8} roughness={0.25} emissive={i % 2 ? LIME : "#000"} emissiveIntensity={i % 2 ? 0.15 : 0} />
        </mesh>
      );
    })}
  </group>
);

/* 04 Aktif-Pasif — balance scale finding equilibrium */
const Balance: React.FC<{ t: number }> = ({ t }) => {
  const tilt = Math.sin(t * 1.4) * 0.3 * Math.exp(-t * 0.35);
  return (
    <group position={[0, 1.6, -2.1]}>
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.0, 16]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <group rotation={[0, 0, tilt]} position={[0, 0.1, 0]}>
        <mesh>
          <boxGeometry args={[3.2, 0.06, 0.06]} />
          <meshStandardMaterial {...steel} />
        </mesh>
        {[-1.5, 1.5].map((x, i) => (
          <group key={x} position={[x, 0, 0]} rotation={[0, 0, -tilt]}>
            <mesh position={[0, -0.45, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.9, 6]} />
              <meshStandardMaterial {...steel} />
            </mesh>
            <mesh position={[0, -0.9, 0]}>
              <cylinderGeometry args={[0.45, 0.35, 0.06, 40]} />
              <meshStandardMaterial {...holo(i ? "#5fd0ff" : LIME, 1)} />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[0, -0.82 + k * 0.1, 0]}>
                <boxGeometry args={[0.5 - k * 0.08, 0.08, 0.3]} />
                <meshStandardMaterial color={k % 2 ? "#e9edf1" : "#30363d"} metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};

/* 05 Teşvik — rising gold coin stacks + map pins */
const Incentive: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {[-2.9, -2.1, 2.1, 2.9].map((x, j) => {
      const n = Math.floor(ease((t - j * 0.35) / 3) * (5 + j * 2));
      return (
        <group key={x} position={[x, -0.95, -1.2]}>
          {Array.from({ length: n }).map((_, k) => (
            <mesh key={k} position={[Math.sin(k) * 0.02, k * 0.085, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.075, 40]} />
              <meshStandardMaterial color="#e3b23c" metalness={1} roughness={0.22} />
            </mesh>
          ))}
        </group>
      );
    })}
    {[[-1.5, 2.0], [0.3, 2.5], [1.5, 1.9]].map(([x, y], i) => (
      <group key={i} position={[x, y + Math.sin(t * 2 + i) * 0.1, -2.4]}>
        <mesh rotation={[Math.PI, 0, 0]} position={[0, -0.22, 0]}>
          <coneGeometry args={[0.13, 0.4, 24]} />
          <meshStandardMaterial {...holo()} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.15, 24, 24]} />
          <meshStandardMaterial {...holo()} />
        </mesh>
      </group>
    ))}
  </group>
);

/* 06 İdari İşler — floating calendar grid, one anomaly tile */
const Admin: React.FC<{ t: number }> = ({ t }) => (
  <group position={[0, 1.95, -2.6]} scale={0.78} rotation={[0.1, Math.sin(t * 0.4) * 0.25, 0]}>
    {Array.from({ length: 20 }).map((_, i) => {
      const cx = (i % 5) - 2, cy = Math.floor(i / 5) - 1.5;
      const hot = i === 13;
      const pulse = hot ? 1 + Math.sin(t * 6) * 0.08 : 1;
      return (
        <mesh key={i} position={[cx * 0.62, -cy * 0.62, Math.sin(t * 1.5 + i) * 0.05]} scale={pulse}>
          <boxGeometry args={[0.54, 0.54, 0.04]} />
          <meshStandardMaterial color={hot ? "#ff4d4d" : i % 7 === 2 ? LIME : "#1b2026"} emissive={hot ? "#ff3030" : i % 7 === 2 ? LIME : "#0b0d10"} emissiveIntensity={hot ? 1.8 : i % 7 === 2 ? 0.9 : 0.2} metalness={0.4} roughness={0.4} />
        </mesh>
      );
    })}
  </group>
);

/* 07 Karşılaştırma — ranking bars, client highest */
const Compare: React.FC<{ t: number }> = ({ t }) => {
  const hs = [1.1, 1.6, 2.6, 1.9, 1.3];
  return (
    <group position={[0, 0.75, -2.8]} scale={0.9}>
      {hs.map((h, i) => {
        const hh = Math.max(0.02, h * ease((t - i * 0.2) / 2.2));
        const me = i === 2;
        return (
          <mesh key={i} position={[(i - 2) * 0.95, hh / 2, 0]}>
            <boxGeometry args={[0.5, hh, 0.5]} />
            <meshStandardMaterial color={me ? LIME : "#3a424b"} emissive={me ? LIME : "#000"} emissiveIntensity={me ? 0.9 : 0} metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};

/* 08 Mizan — spreadsheet cells flowing into a chart */
const Ledger: React.FC<{ t: number }> = ({ t }) => (
  <group position={[0, 2.0, -2.6]} scale={0.82}>
    {Array.from({ length: 36 }).map((_, i) => {
      const cx = (i % 6) - 2.5, cy = Math.floor(i / 6) - 2.5;
      const k = ease((t - 1 - i * 0.03) / 2);
      const x = THREE.MathUtils.lerp(cx * 0.42, (i % 6 - 2.5) * 0.42, k);
      const y = THREE.MathUtils.lerp(-cy * 0.22, -1.1 + (Math.floor(i / 6) * 0.22) * (0.5 + ((i % 6) * 37 % 10) / 10), k);
      return (
        <mesh key={i} position={[x, y, Math.sin(i + t) * 0.04]}>
          <boxGeometry args={[0.38, 0.18, 0.02]} />
          <meshStandardMaterial color={i % 6 === 0 ? LIME : "#d6dde4"} emissive={i % 6 === 0 ? LIME : "#5fd0ff"} emissiveIntensity={i % 6 === 0 ? 0.8 : 0.15} transparent opacity={0.9} />
        </mesh>
      );
    })}
  </group>
);

/* Intro / outro — energy rings */
const Rings: React.FC<{ t: number }> = ({ t }) => (
  <group position={[0, 1.2, -1.6]}>
    {[1.6, 2.1, 2.7].map((r, i) => (
      <mesh key={r} rotation={[Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.3, t * (0.2 + i * 0.1), 0]} scale={ease(t / 1.5)}>
        <torusGeometry args={[r, 0.012 + i * 0.004, 12, 160]} />
        <meshStandardMaterial {...holo(i === 1 ? "#5fd0ff" : LIME, 1.8)} />
      </mesh>
    ))}
  </group>
);

export const PROPS: Record<string, React.FC<{ t: number }>> = {
  s00: Rings, s01: Twin, s02: Risk, s03: Bank, s04: Balance, s05: Incentive, s06: Admin, s07: Compare, s08: Ledger, s09: Rings,
};

export const ENV: Record<string, { fog: string; key: string; rim: string; floor: string }> = {
  s00: { fog: "#05070a", key: "#ffffff", rim: LIME, floor: "#0b0e11" },
  s01: { fog: "#0d0f0c", key: "#ffe6c4", rim: LIME, floor: "#15171a" },
  s02: { fog: "#03101a", key: "#cfe9ff", rim: "#5fd0ff", floor: "#0a1219" },
  s03: { fog: "#100e0b", key: "#fff2dd", rim: "#e3b23c", floor: "#1a1814" },
  s04: { fog: "#060a10", key: "#e4f2ff", rim: "#5fd0ff", floor: "#0e1217" },
  s05: { fog: "#0f0c05", key: "#fff0c9", rim: "#e3b23c", floor: "#17140d" },
  s06: { fog: "#0a0a0d", key: "#ffffff", rim: "#ff5a5a", floor: "#121318" },
  s07: { fog: "#070b07", key: "#ffffff", rim: LIME, floor: "#101410" },
  s08: { fog: "#050b10", key: "#e4f2ff", rim: "#5fd0ff", floor: "#0c1318" },
  s09: { fog: "#05070a", key: "#ffffff", rim: LIME, floor: "#0b0e11" },
};

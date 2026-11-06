import React from "react";

const LIME = "#B6FF3B";

const metal = { color: "#e9edf1", metalness: 0.75, roughness: 0.22 } as const;
const dark = { color: "#14171a", metalness: 0.6, roughness: 0.35 } as const;

const Arm: React.FC<{ side: 1 | -1; t: number; talk: number; wave: number }> = ({ side, t, talk, wave }) => {
  const swing = Math.sin(t * 1.7 + (side > 0 ? 0 : 1.4)) * 0.18 + talk * 0.35 * Math.sin(t * 6 + side);
  const lift = side > 0 ? wave : 0;
  return (
    <group position={[0.72 * side, 0.32, 0]} rotation={[swing - lift * 1.6, 0, side * (0.22 + lift * 0.9)]}>
      <mesh>
        <sphereGeometry args={[0.17, 32, 32]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, -0.34, 0]}>
        <capsuleGeometry args={[0.1, 0.42, 8, 24]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <group position={[0, -0.64, 0]} rotation={[-0.5 - talk * 0.4 - lift * 0.6 + Math.sin(t * 3 + side) * lift * 0.4, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshStandardMaterial toneMapped={false} color={LIME} emissive={LIME} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.095, 0.38, 8, 24]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      </group>
    </group>
  );
};

export const Robot: React.FC<{ t: number; mouth: number; wave?: number; scale?: number }> = ({
  t, mouth, wave = 0, scale = 1,
}) => {
  const hover = Math.sin(t * 1.6) * 0.06;
  const headTilt = Math.sin(t * 0.9) * 0.08 + mouth * 0.06;
  const headTurn = Math.sin(t * 0.55) * 0.18;
  const blink = (t % 3.7) < 0.12 ? 0.15 : 1;
  return (
    <group scale={scale} position={[0, hover, 0]}>
      {/* hover ring */}
      <mesh position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.035, 16, 64]} />
        <meshStandardMaterial toneMapped={false} color={LIME} emissive={LIME} emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, -1.1, 0]} color={LIME} intensity={2.5} distance={3} />
      {/* lower body */}
      <mesh position={[0, -0.62, 0]}>
        <sphereGeometry args={[0.38, 48, 48, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 0, 0]} scale={[1, 1.05, 0.82]}>
        <capsuleGeometry args={[0.55, 0.55, 16, 48]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* chest core */}
      <mesh position={[0, 0.12, 0.47]}>
        <circleGeometry args={[0.16, 48]} />
        <meshStandardMaterial toneMapped={false} color={LIME} emissive={LIME} emissiveIntensity={1.5 + mouth * 2.5} />
      </mesh>
      <mesh position={[0, 0.12, 0.465]}>
        <ringGeometry args={[0.19, 0.24, 48]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.13, 0.17, 0.2, 32]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* head */}
      <group position={[0, 1.12, 0]} rotation={[headTilt, headTurn, Math.sin(t * 0.7) * 0.04]}>
        <mesh scale={[1.12, 0.86, 0.95]}>
          <sphereGeometry args={[0.46, 64, 64]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* visor */}
        <mesh position={[0, 0, 0.14]} scale={[0.98, 0.62, 0.8]}>
          <sphereGeometry args={[0.46, 64, 64, -Math.PI / 2 - 0.9, 1.8, 0.6, 1.95]} />
          <meshStandardMaterial color="#05070a" metalness={0.9} roughness={0.08} />
        </mesh>
        {/* eyes */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.15 * s, 0.05, 0.47]} scale={[1, blink, 1]}>
            <capsuleGeometry args={[0.045, 0.06, 6, 16]} />
            <meshStandardMaterial toneMapped={false} color={LIME} emissive={LIME} emissiveIntensity={3} />
          </mesh>
        ))}
        {/* mouth bar */}
        <mesh position={[0, -0.13, 0.455]} scale={[0.35 + mouth * 0.9, 0.25 + mouth * 1.6, 1]}>
          <boxGeometry args={[0.22, 0.03, 0.01]} />
          <meshStandardMaterial toneMapped={false} color={LIME} emissive={LIME} emissiveIntensity={2 + mouth * 3} />
        </mesh>
        {/* ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.52 * s, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 32]} />
            <meshStandardMaterial {...dark} />
          </mesh>
        ))}
        {/* antenna */}
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 12]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial toneMapped={false} color={LIME} emissive={LIME} emissiveIntensity={2 + Math.sin(t * 5) * 1.5 + 1.5} />
        </mesh>
      </group>
      <Arm side={1} t={t} talk={mouth} wave={wave} />
      <Arm side={-1} t={t} talk={mouth} wave={0} />
    </group>
  );
};

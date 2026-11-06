import React, { useEffect, useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Robot } from "./Robot";
import { PROPS, ENV, LIME } from "./Props";
import timeline from "./timeline.json";

type Scene = (typeof timeline.scenes)[number];
const scenes = timeline.scenes as Scene[];
const FONT = "Inter, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', monospace";

const activeScene = (sec: number) => {
  let idx = 0;
  scenes.forEach((s, i) => { if (sec >= s.start) idx = i; });
  return idx;
};

const EnvSetup: React.FC<{ fog: string }> = ({ fog }) => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  scene.fog = new THREE.FogExp2(fog, 0.075);
  scene.background = new THREE.Color(fog);
  return null;
};

const CameraRig: React.FC<{ idx: number; lt: number; len: number }> = ({ idx, lt, len }) => {
  const { camera } = useThree();
  const p = lt / len;
  const side = idx % 2 ? 1 : -1;
  const close = idx === 0 || idx === scenes.length - 1;
  const z = (close ? 10.2 : 9.4) - p * 1.4;
  const x = side * (1.8 - p * 2.8);
  const y = 0.55 + Math.sin(lt * 0.4) * 0.08;
  camera.position.set(x, y, z);
  camera.lookAt(0, -0.25, -0.8);
  (camera as THREE.PerspectiveCamera).fov = 38;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

const Dust: React.FC<{ t: number; color: string }> = ({ t, color }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 500; const arr = new Float32Array(n * 3);
    let s = 1234;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) { arr[i * 3] = (r() - 0.5) * 12; arr[i * 3 + 1] = r() * 6 - 1; arr[i * 3 + 2] = (r() - 0.5) * 10 - 1; }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} rotation={[0, t * 0.03, 0]} position={[0, Math.sin(t * 0.2) * 0.2, 0]}>
      <pointsMaterial size={0.025} color={color} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
};

const World: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const sec = frame / fps;
  const idx = activeScene(sec);
  const s = scenes[idx];
  const lt = sec - s.start;
  const env = ENV[s.id];
  const Prop = PROPS[s.id];
  const mouth = timeline.mouth[Math.min(frame, timeline.mouth.length - 1)] ?? 0;
  const wave = idx === 0 || idx === scenes.length - 1 ? Math.max(0, Math.sin(Math.min(1, lt / 2.2) * Math.PI)) : 0;
  return (
    <>
      <EnvSetup fog={env.fog} />
      <CameraRig idx={idx} lt={lt} len={s.length} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color={env.key} />
      <directionalLight position={[-4, 3, -3]} intensity={3.2} color={env.rim} />
      <spotLight position={[0, 6, 2]} angle={0.5} penumbra={0.8} intensity={60} color={env.key} distance={14} />
      <pointLight position={[2.5, 1.5, -2]} intensity={6} color={env.rim} distance={7} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={env.floor} metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]}>
        <ringGeometry args={[1.0, 1.04, 96]} />
        <meshStandardMaterial color={env.rim} emissive={env.rim} emissiveIntensity={1.2} transparent opacity={0.6} />
      </mesh>
      <group position={[0, 0.05, 0.4]}>
        <Robot scale={0.95} t={sec} mouth={mouth} wave={wave} />
      </group>
      <Prop t={lt} />
      <Dust t={sec} color={env.rim} />
    </>
  );
};

const Overlay: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const sec = frame / fps;
  const idx = activeScene(sec);
  const s = scenes[idx];
  const lt = sec - s.start;
  const isBook = idx === 0 || idx === scenes.length - 1;
  const inA = interpolate(lt, [0.25, 0.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const outA = interpolate(lt, [s.length - 0.45, s.length], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const a = inA * (idx === scenes.length - 1 ? 1 : outA);
  const flash = interpolate(lt, [0, 0.35], [1, 0], { extrapolateRight: "clamp" });
  const tail = idx === scenes.length - 1 ? interpolate(sec, [timeline.total - 0.8, timeline.total], [0, 1], { extrapolateLeft: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      {/* cinematic grade + vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.88) 100%)" }} />
      {/* top bar */}
      <div style={{ position: "absolute", top: 90, left: 70, right: 70, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 46, letterSpacing: 6 }}>SS<span style={{ color: LIME }}>AI</span></div>
        {!isBook && (
          <div style={{ fontFamily: MONO, fontSize: 30, color: LIME, letterSpacing: 3 }}>
            {String(idx).padStart(2, "0")} / {String(scenes.length - 2).padStart(2, "0")}
          </div>
        )}
      </div>

      {isBook ? (
        <div style={{ position: "absolute", left: 70, right: 70, bottom: 250, opacity: a, transform: `translateY(${(1 - inA) * 40}px)` }}>
          <div style={{ fontWeight: 900, fontSize: 210, lineHeight: 1, letterSpacing: 10 }}>
            SS<span style={{ color: LIME, textShadow: `0 0 40px ${LIME}88` }}>AI</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 64, lineHeight: 1.18, marginTop: 30 }}>{s.text}</div>
          {idx === scenes.length - 1 && (
            <div style={{ marginTop: 50, fontFamily: MONO, fontSize: 52, color: "#0a0c0e", background: LIME, display: "inline-block", padding: "16px 30px", borderRadius: 14, fontWeight: 700 }}>
              www.safineai.com
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: "absolute", left: 70, right: 70, bottom: 230, opacity: a, transform: `translateY(${(1 - inA) * 40}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 32, color: LIME, letterSpacing: 4, textTransform: "uppercase", marginBottom: 18 }}>{s.tag}</div>
          <div style={{ fontWeight: 900, fontSize: 104, lineHeight: 1.02 }}>{s.title}</div>
          <div style={{ width: 140 * inA, height: 8, background: LIME, margin: "30px 0", borderRadius: 4 }} />
          <div style={{ fontWeight: 500, fontSize: 50, lineHeight: 1.25, color: "#e6eaee" }}>{s.text}</div>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 110, left: 70, right: 70, fontFamily: MONO, fontSize: 26, color: "rgba(255,255,255,0.55)", letterSpacing: 3, display: "flex", justifyContent: "space-between" }}>
        <span>ŞİRKETİNİZİN İŞ YAPMA SÜREÇLERİ</span><span>safineai.com</span>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: flash * 0.9 + tail }} />
    </AbsoluteFill>
  );
};

export const SsaiPromo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} linear={false} gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 38, position: [0, 1.3, 7] }}>
        <World frame={frame} fps={fps} />
      </ThreeCanvas>
      <Overlay frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

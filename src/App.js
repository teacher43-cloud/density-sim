import React, { useMemo, useState, useEffect } from "react";

// 9종 고체 물질 (g/cm³)
const MATERIALS = [
  { name: "스티로폼", rho: 0.04 },
  { name: "나무(소나무)", rho: 0.5 },
  { name: "얼음", rho: 0.92 },
  { name: "플라스틱(PP)", rho: 0.9 },
  { name: "플라스틱(PET)", rho: 1.38 },
  { name: "유리", rho: 2.5 },
  { name: "알루미늄", rho: 2.7 },
  { name: "철", rho: 7.87 },
  { name: "구리", rho: 8.96 },
];

const WATER_RHO = 1.0; // g/cm³

function formatVolumeCm3(V) {
  if (V >= 1000) return `${(V / 1000).toFixed(2)} L`;
  return `${V.toFixed(0)} cm³`;
}

function formatMassG(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} kg`;
  return `${m.toFixed(0)} g`;
}

function calcValues(rho, Lcm) {
  const Vcm3 = Math.pow(Lcm, 3);
  const mG = rho * Vcm3;
  const floats = rho < WATER_RHO ? "뜸" : "가라앉음";
  return { volumeCm3: Vcm3, massG: mG, density: rho, floats };
}

function ValuePanel({ title, values, hideAnswers, reveal = { mass: true, volume: true, density: true, state: true } }) {
  const { volumeCm3, massG, density, floats } = values;
  return (
    <div className="mt-3 bg-gray-50 p-4 rounded-2xl font-mono text-[15px] grid gap-1">
      <div className="text-sm font-semibold text-gray-600">{title}</div>
      <div>부피: <span className="font-bold">{reveal.volume ? formatVolumeCm3(volumeCm3) : "—"}</span></div>
      <div>질량: <span className="font-bold">{reveal.mass ? formatMassG(massG) : "—"}</span></div>
      <div className="flex items-center gap-2">
        <span>밀도:</span>
        <span className="font-bold tabular-nums">
          {reveal.density && !hideAnswers ? `${density.toFixed(2)} g/cm³` : "—"}
        </span>
      </div>
      <div>
        상태: {reveal.state && !hideAnswers ? (
          <span className={`font-bold ${floats === "뜸" ? "text-emerald-600" : "text-rose-600"}`}>
            {floats} {floats === "뜸" ? "✅" : "❌"}
          </span>
        ) : <span className="font-bold">—</span>}
      </div>
    </div>
  );
}

function Slot({ label, matIndex, setMatIndex, L, setL, hideAnswers }) {
  const mat = MATERIALS[matIndex];
  const vals = useMemo(() => calcValues(mat.rho, L), [mat, L]);

  return (
    <div className="p-5 border rounded-3xl shadow-sm bg-white grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{label}</h2>
        <span className="text-xs text-gray-500">한 변 L: {L} cm</span>
      </div>

      <select
        value={mat.name}
        onChange={(e) => {
          const idx = MATERIALS.findIndex((m) => m.name === e.target.value);
          setMatIndex(idx === -1 ? 0 : idx);
        }}
        className="p-2 border rounded-xl w-full"
      >
        {MATERIALS.map((m) => (
          <option key={m.name} value={m.name}>{m.name}</option>
        ))}
      </select>

      <input type="range" min={1} max={70} step={0.1} value={L} onChange={(e) => setL(Number(e.target.value))} className="w-full" />

      <ValuePanel title={`${label} 측정값`} values={vals} hideAnswers={hideAnswers} />
    </div>
  );
}

function ComparePhysicsPanel({ hideAnswers }) {
  const [aMatIndex, setAMatIndex] = useState(0),   [aL, setAL] = useState(10);
  const [bMatIndex, setBMatIndex] = useState(6),   [bL, setBL] = useState(10);

  const WORLD_W = 220, WORLD_H = 180, PADDING = 30;
  const INNER_TOP = PADDING, INNER_BOTTOM = WORLD_H - PADDING;
  const WATERLINE_Y = 80, WATERLINE_WORLD_Y = INNER_TOP + WATERLINE_Y;
  const SCALE = 3;

  const [running,setRunning] = useState(false), [paused,setPaused]=useState(false);
  const [aY,setAY] = useState(INNER_TOP), [bY,setBY] = useState(INNER_TOP);
  const [aV,setAV] = useState(0),  [bV,setBV] = useState(0);
  const G = 981, DAMP = 3.0;

  const aVals = useMemo(()=>calcValues(MATERIALS[aMatIndex].rho, aL), [aMatIndex,aL]);
  const bVals = useMemo(()=>calcValues(MATERIALS[bMatIndex].rho, bL), [bMatIndex,bL]);
  const heavier = aVals.massG > bVals.massG ? "A" : aVals.massG < bVals.massG ? "B" : "동일";

  const immersionDepth = (top, L) => {
    const bottom = top + L;
    const immersedTop = Math.max(top, WATERLINE_WORLD_Y);
    const immersedBottom = Math.min(bottom, INNER_BOTTOM);
    return Math.max(0, immersedBottom - immersedTop);
  };

  useEffect(()=>{
    let rafId, last = performance.now();
    const step = (t)=>{
      rafId = requestAnimationFrame(step);
      const dt = Math.min(0.033, (t-last)/1000); last = t;
      if (!running || paused) return;

      const advance = (y,v,L,rho)=>{
        const d = immersionDepth(y, L);
        const buoyTerm = (d>0) ? (WATER_RHO / rho) * (d / L) : 0;
        const a = G * (1 - buoyTerm) - DAMP * v;
        let v2 = v + a*dt;
        let y2 = y + v2*dt;
        const floor = INNER_BOTTOM - L, ceil  = INNER_TOP;
        if (y2 > floor) { y2 = floor; v2 = -v2 * 0.2; }
        if (y2 < ceil)  { y2 = ceil;  v2 = 0; }
        return [y2, v2];
      };

      const [naY,naV] = advance(aY,aV,aL,MATERIALS[aMatIndex].rho);
      const [nbY,nbV] = advance(bY,bV,bL,MATERIALS[bMatIndex].rho);
      setAY(naY); setAV(naV); setBY(nbY); setBV(nbV);
    };
    rafId = requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(rafId);
  }, [running, paused, aY, aV, bY, bV, aL, bL, aMatIndex, bMatIndex]);

  const dropBoth = ()=>{
    setAY(WATERLINE_WORLD_Y - aL - 5);
    setBY(WATERLINE_WORLD_Y - bL - 5);
    setAV(0); setBV(0); setRunning(true); setPaused(false);
  };

  return (
    <div className="grid gap-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Slot label="슬롯 A" matIndex={aMatIndex} setMatIndex={setAMatIndex} L={aL} setL={setAL} hideAnswers={hideAnswers}/>
          <Slot label="슬롯 B" matIndex={bMatIndex} setMatIndex={setBMatIndex} L={bL} setL={setBL} hideAnswers={hideAnswers}/>
        </div>
        <div className="p-5 border rounded-3xl bg-white shadow-sm">
          <h3 className="font-bold text-lg">비교 요약</h3>
          <div className="text-sm text-gray-600">물(1.00 g/cm³)을 기준으로 판단합니다.</div>
          <div className="grid gap-2 font-mono">
            <div><span className="font-semibold">질량 비교:</span> <span className="font-bold">{heavier==="동일"?"동일":`${heavier}가 더 무거움`}</span></div>
            <div><span className="font-semibold">상태(A/B):</span> <span className="font-bold">{hideAnswers?"— / —":`${aVals.floats} / ${bVals.floats}`}</span></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={dropBoth} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white">드롭(낙하)</button>
            <button onClick={()=>setPaused(p=>!p)} className="px-4 py-2 rounded-2xl bg-gray-100">{paused?"재개":"일시정지"}</button>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-3xl bg-white">
        <svg width={WORLD_W*SCALE} height={WORLD_H*SCALE} className="block max-w-full">
          <rect x={0} y={0} width={WORLD_W*SCALE} height={WORLD_H*SCALE} fill="#f8fafc" />
          <rect x={PADDING*SCALE} y={PADDING*SCALE} width={(WORLD_W-2*PADDING)*SCALE} height={(WORLD_H-2*PADDING)*SCALE} fill="#fff" stroke="#94a3b8" strokeWidth={2} rx={8} />
          <rect x={PADDING*SCALE} y={WATERLINE_WORLD_Y*SCALE} width={(WORLD_W-2*PADDING)*SCALE} height={(INNER_BOTTOM-WATERLINE_WORLD_Y)*SCALE} fill="#bfdbfe" opacity={0.8} />
          <line x1={PADDING*SCALE} x2={(WORLD_W-PADDING)*SCALE} y1={WATERLINE_WORLD_Y*SCALE} y2={WATERLINE_WORLD_Y*SCALE} stroke="#3b82f6" strokeWidth={2} />
          {(() => {
            const leftCX  = PADDING + 40, rightCX = WORLD_W - PADDING - 40;
            const ax = (leftCX - aL/2) * SCALE, bx = (rightCX - bL/2) * SCALE;
            const ay = aY * SCALE, by = bY * SCALE;
            return (
              <g>
                <rect x={ax} y={ay} width={aL*SCALE} height={aL*SCALE} fill="#10b981" />
                <rect x={bx} y={by} width={bL*SCALE} height={bL*SCALE} fill="#f59e0b" />
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="p-6 max-w-6xl mx-auto grid gap-6">
      <h1 className="text-2xl font-bold">밀도 시뮬레이션</h1>
      <ComparePhysicsPanel hideAnswers={false} />
    </div>
  );
}

export default App;

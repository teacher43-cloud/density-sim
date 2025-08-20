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

  const preset = () => {
    setAMatIndex(MATERIALS.findIndex(m=>m.name==="스티로폼")); setAL(65);
    setBMatIndex(MATERIALS.findIndex(m=>m.name==="알루미늄")); setBL(3.5);
    setAY(WATERLINE_WORLD_Y - 65 - 5); setBY(WATERLINE_WORLD_Y - 3.5 - 5);
    setAV(0); setBV(0); setRunning(true); setPaused(false);
  };
  const resetAll = () => {
    setAMatIndex(0); setAL(10);
    setBMatIndex(6); setBL(10);
    setAY(INNER_TOP); setBY(INNER_TOP);
    setAV(0); setBV(0); setRunning(false); setPaused(false);
  };

  useEffect(()=>{ if(!running) setAY(INNER_TOP); }, [aL, running]);
  useEffect(()=>{ if(!running) setBY(INNER_TOP); }, [bL, running]);

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
        <div className="p-5 border rounded-3xl bg-white shadow-sm grid gap-3 h-fit">
          <h3 className="font-bold text-lg">비교 요약</h3>
          <div className="text-sm text-gray-600">물(1.00 g/cm³)을 기준으로 판단합니다.</div>
          <div className="grid gap-2 font-mono">
            <div><span className="font-semibold">질량 비교:</span> <span className="font-bold">{heavier==="동일"?"동일":`${heavier}가 더 무거움`}</span></div>
            <div><span className="font-semibold">상태(A/B):</span> <span className="font-bold">{hideAnswers?"— / —":`${aVals.floats} / ${bVals.floats}`}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={preset} className="px-4 py-2 rounded-2xl bg-emerald-600 text-white shadow">인지 부조화 프리셋</button>
            <button onClick={dropBoth} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white shadow">드롭(낙하)</button>
            <button onClick={()=>setPaused(p=>!p)} className="px-4 py-2 rounded-2xl bg-gray-100">{paused?"재개":"일시정지"}</button>
            <button onClick={resetAll} className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-800">초기화</button>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-3xl bg-white">
        <div className="text-sm font-semibold mb-2">시각화: 수조 + 블록(정육면체)</div>
        <svg width={WORLD_W*SCALE} height={WORLD_H*SCALE} className="block max-w-full">
          <rect x={0} y={0} width={WORLD_W*SCALE} height={WORLD_H*SCALE} fill="#f8fafc" />
          <rect x={PADDING*SCALE} y={PADDING*SCALE} width={(WORLD_W-2*PADDING)*SCALE} height={(WORLD_H-2*PADDING)*SCALE} fill="#ffffff" stroke="#94a3b8" strokeWidth={2} rx={8} />
          <rect x={PADDING*SCALE} y={WATERLINE_WORLD_Y*SCALE} width={(WORLD_W-2*PADDING)*SCALE} height={(INNER_BOTTOM-WATERLINE_WORLD_Y)*SCALE} fill="#bfdbfe" opacity={0.8} />
          <line x1={PADDING*SCALE} x2={(WORLD_W-PADDING)*SCALE} y1={WATERLINE_WORLD_Y*SCALE} y2={WATERLINE_WORLD_Y*SCALE} stroke="#3b82f6" strokeWidth={2} />
          {(() => {
            const leftCX  = PADDING + 40, rightCX = WORLD_W - PADDING - 40;
            const ax = (leftCX - aL/2) * SCALE, bx = (rightCX - bL/2) * SCALE;
            const ay = aY * SCALE, by = bY * SCALE;
            return (
              <g>
                <rect x={ax} y={ay} width={aL*SCALE} height={aL*SCALE} fill="#10b981" opacity={0.9} stroke="#059669" />
                <rect x={bx} y={by} width={bL*SCALE} height={bL*SCALE} fill="#f59e0b" opacity={0.9} stroke="#d97706" />
                <text x={ax+4} y={ay+16} fontSize={12} fill="#064e3b">A</text>
                <text x={bx+4} y={by+16} fontSize={12} fill="#7c2d12">B</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

function QuizView({ score, setScore }) {
  const [mysteryIndex, setMysteryIndex] = useState(Math.floor(Math.random() * MATERIALS.length));
  const [L, setL] = useState(() => Number((Math.random() * 35 + 5).toFixed(1)));
  const mat = MATERIALS[mysteryIndex];
  const vals = useMemo(() => calcValues(mat.rho, L), [mat, L]);

  const [revealMass, setRevealMass] = useState(false);
  const [revealVolume, setRevealVolume] = useState(false);
  const [answerIndex, setAnswerIndex] = useState(-1);
  const [checked, setChecked] = useState(false);
  const correct = checked && answerIndex === mysteryIndex;

  const newQuestion = () => {
    setMysteryIndex(Math.floor(Math.random() * MATERIALS.length));
    setL(Number((Math.random() * 35 + 5).toFixed(1)));
    setRevealMass(false); setRevealVolume(false);
    setAnswerIndex(-1); setChecked(false);
  };

  const checkAnswer = () => {
    if (answerIndex === -1) return;
    setChecked(true);
    setScore((s) => ({ attempts: s.attempts + 1, correct: s.correct + (answerIndex === mysteryIndex ? 1 : 0) }));
  };

  return (
    <div className="grid gap-4">
      <div className="p-4 border rounded-2xl bg-white flex flex-wrap items-center gap-3 text-sm">
        <div className="font-semibold">퀴즈 점수</div>
        <div className="font-mono">정답: <span className="font-bold text-emerald-600">{score.correct}</span></div>
        <div className="font-mono">시도: <span className="font-bold">{score.attempts}</span></div>
        <div className="font-mono">정답률: <span className="font-bold">{score.attempts ? Math.round((score.correct / score.attempts) * 100) : 0}%</span></div>
        <button onClick={() => setScore({ attempts: 0, correct: 0 })} className="ml-auto px-3 py-1.5 rounded-xl bg-gray-100">점수 초기화</button>
      </div>

      <div className="p-4 border rounded-3xl bg-white grid gap-2">
        <div className="text-lg font-bold">미지 블록</div>
        <div className="text-sm text-gray-600">한 변 길이 L은 고정되어 있습니다. 저울/수조 버튼을 눌러 질량과 부피를 측정해 보세요.</div>
        <div className="text-sm text-gray-500">한 변 L: <span className="font-mono font-semibold">{L} cm</span> (고정)</div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => setRevealMass((v) => !v)} className={`px-4 py-2 rounded-2xl shadow ${revealMass ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>저울 올리기(질량)</button>
          <button onClick={() => setRevealVolume((v) => !v)} className={`px-4 py-2 rounded-2xl shadow ${revealVolume ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>물에 담그기(부피)</button>
          <button onClick={newQuestion} className="px-4 py-2 rounded-2xl bg-gray-200">새 문제</button>
        </div>

        <ValuePanel title="측정 결과" values={vals} hideAnswers={true} reveal={{ mass: revealMass, volume: revealVolume, density: false, state: false }} />

        <div className="grid gap-2 pt-2">
          <label className="text-sm font-semibold">

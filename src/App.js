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

// --- (ValuePanel, Slot, ComparePhysicsPanel, QuizView 컴포넌트들 중략) ---
// 👉 네가 붙여넣은 긴 코드 전부 App.js 안에 그대로 두면 됨.
// 마지막에 꼭 "App"을 export 해줘야 함.

function App() {
  const [mode, setMode] = useState("compare");
  const [score, setScore] = useState({ attempts: 0, correct: 0 });

  return (
    <div className="p-6 max-w-6xl mx-auto grid gap-6">
      <h1 className="text-2xl font-bold">밀도 시뮬레이션</h1>
      <div className="flex gap-3">
        <button onClick={() => setMode("compare")}
          className={`px-4 py-2 rounded-xl ${mode==="

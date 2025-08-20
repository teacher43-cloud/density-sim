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
  const V = Math.pow(Lcm, 3); // 부피 (cm³)
  const m = rho * V;          // 질량 (g)
  const floats = rho < WATER_RHO;
  return { V, m, floats };
}

export default function App() {
  const [materialIndex, setMaterialIndex] = useState(0);
  const [length, setLength] = useState(10); // cm

  const { V, m, floats } = useMemo(
    () => calcValues(MATERIALS[materialIndex].rho, length),
    [materialIndex, length]
  );

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, background: "#eef" }}>
      <h1>밀도 시뮬레이션</h1>

      {/* 물질 선택 */}
      <label>
        물질 선택:{" "}
        <select
          value={materialIndex}
          onChange={(e) => setMaterialIndex(Number(e.target.value))}
        >
          {MATERIALS.map((mat, i) => (
            <option key={i} value={i}>
              {mat.name} (ρ={mat.rho} g/cm³)
            </option>
          ))}
        </select>
      </label>

      {/* 한 변의 길이 조절 */}
      <div style={{ marginTop: 20 }}>
        <label>
          한 변의 길이: {length} cm
          <br />
          <input
            type="range"
            min="1"
            max="30"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
        </label>
      </div>

      {/* 결과 표시 */}
      <div style={{ marginTop: 20 }}>
        <p>부피: {formatVolumeCm3(V)}</p>
        <p>질량: {formatMassG(m)}</p>
        <p>물에 넣으면: {floats ? "⛵ 뜬다" : "⚓ 가라앉는다"}</p>
      </div>

      {/* 단순 시각화 */}
      <div style={{ marginTop: 30 }}>
        <div
          style={{
            width: 200,
            height: 200,
            background: "lightblue",
            position: "relative",
          }}
        >
          <div
            style={{
              width: length * 5,
              height: length * 5,
              background: floats ? "orange" : "brown",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: floats ? 50 : 120,
              transition: "top 0.5s",
            }}
          />
        </div>
        <p style={{ textAlign: "center" }}>물속에서의 물체</p>
      </div>
    </div>
  );
}

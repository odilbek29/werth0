// App.jsx
import React, { useMemo, useState } from "react";
import "./App.css";

const BASE_PRICES = {
  profilePerMeter: { PVC: 120000, Aluminum: 220000 }, // so'm / metr
  glassPerSqm: { single: 150000, double: 280000, tempered: 420000 }, // so'm / m²
  barPerMeter: 70000, // so'm / metr
  installation: 180000,
};

// utility
const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " so'm";

export default function App() {
  const [type, setType] = useState("window"); // window | door | balcony
  const [widthCm, setWidthCm] = useState(120);
  const [heightCm, setHeightCm] = useState(150);

  const [frameThicknessCm, setFrameThicknessCm] = useState(6);
  const [barThicknessCm, setBarThicknessCm] = useState(3);
  const [verticalBars, setVerticalBars] = useState(1);
  const [horizontalBars, setHorizontalBars] = useState(0);

  const [profileType, setProfileType] = useState("PVC");
  const [glassType, setGlassType] = useState("double");
  const [frameColor, setFrameColor] = useState("#333333");
  const [barColor, setBarColor] = useState("#333333");

  // scale preview: compute px per cm so preview fits
  const { pxPerCm, previewW, previewH, framePx, barPx } = useMemo(() => {
    const maxW = 420;
    const maxH = 520;
    const w = Math.max(30, Math.min(400, Number(widthCm || 120)));
    const h = Math.max(30, Math.min(800, Number(heightCm || 150)));
    let p = Math.min(4, maxW / w, maxH / h);
    if (p < 0.4) p = 0.4;
    const fpx = Math.max(2, Math.round(frameThicknessCm * p));
    const bpx = Math.max(2, Math.round(barThicknessCm * p));
    return {
      pxPerCm: p,
      previewW: Math.round(w * p),
      previewH: Math.round(h * p),
      framePx: fpx,
      barPx: bpx,
    };
  }, [widthCm, heightCm, frameThicknessCm, barThicknessCm]);

  // price calculation (approx)
  const price = useMemo(() => {
    const wM = Math.max(0.3, widthCm / 100);
    const hM = Math.max(0.3, heightCm / 100);
    const area = wM * hM;
    const perimeter = 2 * (wM + hM);

    const profilePricePerM = BASE_PRICES.profilePerMeter[profileType] || BASE_PRICES.profilePerMeter.PVC;
    const thicknessFactor = Math.max(0.5, frameThicknessCm / 6);
    const frameCost = Math.round(perimeter * profilePricePerM * thicknessFactor);

    const glassPricePerM2 = BASE_PRICES.glassPerSqm[glassType] || BASE_PRICES.glassPerSqm.double;
    const glassCost = Math.round(area * glassPricePerM2);

    const verticalLength = hM * verticalBars;
    const horizontalLength = wM * horizontalBars;
    const barsLength = verticalLength + horizontalLength;
    const barsCost = Math.round(barsLength * BASE_PRICES.barPerMeter * Math.max(0.6, barThicknessCm / 3));

    // type multiplier: doors cost more (handles, hinges), balconies more material
    const typeMultiplier = type === "door" ? 1.15 : type === "balcony" ? 1.12 : 1.0;

    const installation = BASE_PRICES.installation;

    const total = Math.round((frameCost + glassCost + barsCost) * typeMultiplier + installation);
    return { area, perimeter, frameCost, glassCost, barsCost, installation, total, typeMultiplier };
  }, [widthCm, heightCm, frameThicknessCm, barThicknessCm, verticalBars, horizontalBars, profileType, glassType, type]);

  // render bars inside glass area
  const renderVerticalBars = () => {
    if (verticalBars <= 0) return null;
    return Array.from({ length: verticalBars }).map((_, i) => {
      const leftPercent = ((i + 1) / (verticalBars + 1)) * 100;
      return (
        <div
          key={"v" + i}
          className="rc-bar rc-bar-vertical"
          style={{
            left: `${leftPercent}%`,
            width: `${barPx}px`,
            marginLeft: `${-barPx / 2}px`,
            background: barColor,
          }}
        />
      );
    });
  };

  const renderHorizontalBars = () => {
    if (horizontalBars <= 0) return null;
    return Array.from({ length: horizontalBars }).map((_, i) => {
      const topPercent = ((i + 1) / (horizontalBars + 1)) * 100;
      return (
        <div
          key={"h" + i}
          className="rc-bar rc-bar-horizontal"
          style={{
            top: `${topPercent}%`,
            height: `${barPx}px`,
            marginTop: `${-barPx / 2}px`,
            background: barColor,
          }}
        />
      );
    });
  };

  // special visuals by type
  const renderTypeExtras = () => {
    if (type === "door") {
      // handle on right side
      return <div className="rc-door-handle" style={{ right: Math.max(8, framePx * 0.6), height: Math.max(24, barPx * 2) }} />;
    }
    if (type === "balcony") {
      // small floor ledge
      return <div className="rc-balcony-ledge" style={{ height: Math.max(6, Math.round(framePx * 0.6)) }} />;
    }
    return null;
  };

  // glass style dimensions
  const glassWidth = Math.max(10, previewW - 2 * framePx);
  const glassHeight = Math.max(10, previewH - 2 * framePx);

  return (
    <div className="rc-app">
      <h2 className="rc-h">Konfigurator — Deraza / Eshik / Balkon</h2>
      <div className="rc-wrap">
        <div className="rc-left">
          <div
            className="rc-frame"
            style={{
              width: previewW,
              height: previewH,
              padding: framePx,
              background: frameColor,
            }}
          >
            <div className="rc-glass" style={{ width: glassWidth, height: glassHeight, background: glassType === "double" ? "#e6f7ff" : "#f8fbff" }}>
              {renderVerticalBars()}
              {renderHorizontalBars()}
              {renderTypeExtras()}
            </div>
          </div>

          <div className="rc-preview-meta">
            <div>Preview: {previewW}×{previewH} px</div>
            <div>Skala: {pxPerCm.toFixed(2)} px/cm</div>
            <div>Type: {type}</div>
          </div>
        </div>

        <div className="rc-right">
          <label className="rc-row">
            <span>Mahsulot turi</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="window">Deraza</option>
              <option value="door">Eshik</option>
              <option value="balcony">Balkon</option>
            </select>
          </label>

          <div className="rc-row rc-inline">
            <label>
              <span>Kenglik (cm)</span>
              <input type="number" min="30" value={widthCm} onChange={(e) => setWidthCm(Number(e.target.value))} />
            </label>
            <label>
              <span>Balandlik (cm)</span>
              <input type="number" min="30" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} />
            </label>
          </div>

          <div className="rc-row rc-inline">
            <label>
              <span>Ramka (cm)</span>
              <input type="number" min="2" value={frameThicknessCm} onChange={(e) => setFrameThicknessCm(Number(e.target.value))} />
            </label>
            <label>
              <span>Tayoq (cm)</span>
              <input type="number" min="1" value={barThicknessCm} onChange={(e) => setBarThicknessCm(Number(e.target.value))} />
            </label>
          </div>

          <div className="rc-row rc-inline">
            <label>
              <span>Vertikal tayoq</span>
              <input type="number" min="0" value={verticalBars} onChange={(e) => setVerticalBars(Number(e.target.value))} />
            </label>
            <label>
              <span>Gorizontal tayoq</span>
              <input type="number" min="0" value={horizontalBars} onChange={(e) => setHorizontalBars(Number(e.target.value))} />
            </label>
          </div>

          <div className="rc-row rc-inline">
            <label>
              <span>Profil</span>
              <select value={profileType} onChange={(e) => setProfileType(e.target.value)}>
                <option value="PVC">PVC</option>
                <option value="Aluminum">Aluminum</option>
              </select>
            </label>
            <label>
              <span>Shisha</span>
              <select value={glassType} onChange={(e) => setGlassType(e.target.value)}>
                <option value="single">Yagona</option>
                <option value="double">Ikki qavat</option>
                <option value="tempered">Tempered</option>
              </select>
            </label>
          </div>

          <div className="rc-row rc-inline">
            <label>
              <span>Ramka rangi</span>
              <input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} />
            </label>
            <label>
              <span>Tayoq rangi</span>
              <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} />
            </label>
          </div>

          <div className="rc-price">
            <h3>Hisob</h3>
            <div className="rc-price-row"><span>Shisha ({price.area.toFixed(2)} m²)</span><b>{fmt(price.glassCost)}</b></div>
            <div className="rc-price-row"><span>Ramka (perim {price.perimeter.toFixed(2)} m)</span><b>{fmt(price.frameCost)}</b></div>
            <div className="rc-price-row"><span>Tayoqchalar</span><b>{fmt(price.barsCost)}</b></div>
            <div className="rc-price-row"><span>O'rnatish</span><b>{fmt(price.installation)}</b></div>
            <div className="rc-price-row total"><span>Jami</span><b>{fmt(price.total)}</b></div>
            <button className="rc-button" onClick={() => alert("Demo: buyurtma qabul qilinmadi — bu faqat prototip.")}>Buyurtma berish</button>
          </div>
        </div>
      </div>
    </div>
  );
}

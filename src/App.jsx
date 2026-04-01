import { useState, useMemo } from "react";

const DATA = {
  4: {
    range: [120, 150],
    points: [
      { size: 120, values: [21.5, 37, 31, 30.5] },
      { size: 125, values: [22.5, 39, 33, 30.5] },
      { size: 130, values: [23.5, 41, 35, 30.5] },
      { size: 135, values: [24.5, 43, 37, 33] },
      { size: 140, values: [25, 44, 38, 33] },
      { size: 145, values: [25.5, 45, 39, 35.5] },
      { size: 150, values: [26.5, 47, 41, 35.5] },
    ],
  },
  5: {
    range: [151, 220],
    points: [
      { size: 155, values: [24, 42, 36, 30, 23] },
      { size: 160, values: [24.5, 43, 37, 31, 24.5] },
      { size: 165, values: [25, 44, 38, 32, 26] },
      { size: 170, values: [25.5, 45, 39, 33, 27.5] },
      { size: 175, values: [26, 46, 40, 34, 29] },
      { size: 180, values: [26.5, 47, 41, 35, 30.5] },
      { size: 185, values: [27, 48, 42, 36, 32] },
      { size: 190, values: [27.5, 49, 43, 37, 33.5] },
      { size: 195, values: [28, 50, 44, 38, 35] },
      { size: 200, values: [28.5, 51, 45, 39, 36.5] },
      { size: 205, values: [29, 52, 46, 40, 38] },
      { size: 210, values: [30, 54, 48, 42, 36] },
      { size: 215, values: [30.5, 55, 49, 43, 37.5] },
      { size: 220, values: [31, 56, 50, 44, 39] },
    ],
  },
  6: {
    range: [221, 260],
    points: [
      { size: 225, values: [28.5, 51, 45, 39, 33, 28.5] },
      { size: 230, values: [29, 52, 46, 40, 34, 29] },
      { size: 235, values: [29.5, 53, 47, 41, 35, 29.5] },
      { size: 240, values: [30, 54, 48, 42, 36, 30] },
      { size: 245, values: [30.5, 55, 49, 43, 37, 30.5] },
      { size: 250, values: [31, 56, 50, 44, 38, 31] },
      { size: 255, values: [31.5, 57, 51, 45, 39, 31.5] },
      { size: 260, values: [32, 58, 52, 46, 40, 32] },
    ],
  },
};

function roundHalf(n) { return Math.round(n * 2) / 2; }

// TODO: 6단 선택지 추가 예정 - forceKansu 파라미터 활성화하여 사용자 강제 선택 가능
function getKansu(height) {
  if (height < 120) return null;
  if (height <= 150) return 4;
  if (height <= 220) return 5;
  if (height >= 221) return 6;
  return null;
}

function getFailureCount(width) {
  if (width <= 130) return 2;
  if (width <= 200) return 3;
  return 3;
}

function interpolate(height) {
  const kansu = getKansu(height);
  if (!kansu) return null;
  const data = DATA[kansu];
  if (!data) return null;
  const points = data.points;
  const exact = points.find((p) => p.size === height);
  if (exact) return { kansu, values: exact.values, isExact: true };
  let lower = null, upper = null;
  for (let i = 0; i < points.length - 1; i++) {
    if (height >= points[i].size && height <= points[i + 1].size) { lower = points[i]; upper = points[i + 1]; break; }
  }
  if (!lower || !upper) {
    if (height > points[points.length - 1].size) { lower = points[points.length - 2]; upper = points[points.length - 1]; }
    else if (height < points[0].size) { lower = points[0]; upper = points[1]; }
  }
  if (!lower || !upper) return null;
  const ratio = (height - lower.size) / (upper.size - lower.size);
  const values = lower.values.map((v, i) => roundHalf(v + (upper.values[i] - v) * ratio));
  return { kansu, values, isExact: false };
}

function getDanNames(kansu) {
  const names = [];
  for (let i = 1; i <= kansu; i++) {
    if (i === 1) names.push("하단 1단");
    else if (i === kansu) names.push(`상단 ${i}단`);
    else names.push(`${i}단`);
  }
  return names;
}

const C = { bg:"#f8f7f4",card:"#ffffff",primary:"#2c3e50",accent:"#c0956c",accentLight:"#f0e6d8",border:"#e8e2d8",text:"#333",textLight:"#888",warn:"#c4883a",error:"#b91c1c",errorBg:"#fef2f2",errorBorder:"#fecaca",danColors:["#d4a574","#c0956c","#a67c52","#8c6239","#724d2b","#5a3a1e"] };

export default function RomanShadeCalculator() {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const canCalc = width !== "" && height !== "";

  const handleCalc = () => {
    const w = parseFloat(width), h = parseFloat(height);
    if (isNaN(w) || w <= 0) { setResult({ error: "가로 사이즈를 올바르게 입력해주세요." }); return; }
    if (isNaN(h) || h < 120 || h > 260) { setResult({ error: "세로 사이즈는 120~260cm 범위로 입력해주세요." }); return; }
    const res = interpolate(h);
    if (!res) { setResult({ error: "계산할 수 없는 범위입니다." }); return; }
    setResult({ ...res, height: h, width: w, failureCount: getFailureCount(w) });
  };
  const handleKey = (e) => { if (e.key === "Enter" && canCalc) handleCalc(); };
  const handleReset = () => { setWidth(""); setHeight(""); setResult(null); };

  const fullTable = useMemo(() => {
    const rows = [];
    for (let s = 120; s <= 260; s++) { const res = interpolate(s); if (res) rows.push({ size: s, ...res }); }
    return rows;
  }, []);
  const totalSum = result && !result.error ? result.values.reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ minHeight:"100vh",background:C.bg,fontFamily:"'Pretendard',-apple-system,sans-serif",color:C.text,padding:"24px 16px" }}>
      <div style={{ maxWidth:560,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ fontSize:13,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:8,fontWeight:600 }}>Roman Shade</div>
          <h1 style={{ fontSize:22,fontWeight:700,color:C.primary,margin:0,lineHeight:1.4 }}>로만쉐이드 제작 사이즈 계산기</h1>
          <p style={{ fontSize:13,color:C.textLight,marginTop:8 }}>가로·세로 사이즈를 입력하면 각 단별 제작 사이즈와 실패 개수를 자동 산출합니다</p>
        </div>
        <div style={{ background:C.card,borderRadius:12,padding:"24px 20px",border:`1px solid ${C.border}`,marginBottom:20 }}>
          <label style={{ fontSize:13,fontWeight:600,color:C.primary,display:"block",marginBottom:8 }}>가로 사이즈</label>
          <div style={{ position:"relative",marginBottom:16 }}><input type="number" value={width} onChange={(e)=>setWidth(e.target.value)} onKeyDown={handleKey} placeholder="예: 150" min={1} step={0.5} style={inputStyle} onFocus={(e)=>(e.target.style.borderColor=C.accent)} onBlur={(e)=>(e.target.style.borderColor=C.border)} /><span style={unitStyle}>cm</span></div>
          <label style={{ fontSize:13,fontWeight:600,color:C.primary,display:"block",marginBottom:8 }}>세로 사이즈 (120~260cm)</label>
          <div style={{ position:"relative",marginBottom:20 }}><input type="number" value={height} onChange={(e)=>setHeight(e.target.value)} onKeyDown={handleKey} placeholder="예: 137" min={120} max={260} step={0.5} style={inputStyle} onFocus={(e)=>(e.target.style.borderColor=C.accent)} onBlur={(e)=>(e.target.style.borderColor=C.border)} /><span style={unitStyle}>cm</span></div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={handleCalc} disabled={!canCalc} style={{ flex:1,padding:"13px 0",background:canCalc?C.primary:"#ccc",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:canCalc?"pointer":"not-allowed" }} onMouseEnter={(e)=>{if(canCalc)e.target.style.opacity="0.85";}} onMouseLeave={(e)=>(e.target.style.opacity="1")}>계산하기</button>
            <button onClick={handleReset} style={{ padding:"13px 20px",background:"none",color:C.textLight,border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer" }}>초기화</button>
          </div>
        </div>
        {result?.error && typeof result.error==="string" && (<div style={{ background:C.errorBg,border:`1px solid ${C.errorBorder}`,borderRadius:10,padding:"16px 20px",marginBottom:20,fontSize:14,color:C.error }}>{result.error}</div>)}
        {result && !result.error && (
          <div style={{ background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:20 }}>
            <div style={{ padding:"18px 20px",borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontSize:14,color:C.textLight }}>가로</span><span style={{ fontSize:22,fontWeight:700,color:C.primary }}>{result.width}cm</span>
                  <span style={{ fontSize:14,color:C.textLight,margin:"0 4px" }}>×</span>
                  <span style={{ fontSize:14,color:C.textLight }}>세로</span><span style={{ fontSize:22,fontWeight:700,color:C.primary }}>{result.height}cm</span>
                </div>
                <span style={{ fontSize:13,color:C.accent,fontWeight:600,background:C.accentLight,padding:"3px 10px",borderRadius:20 }}>{result.kansu}칸</span>
              </div>
              <div style={{ display:"flex",gap:16,fontSize:13,color:C.textLight }}>
                <span>단 합계: <b style={{ color:C.text }}>{roundHalf(totalSum)}cm</b></span>
                {!result.isExact && <span style={{ color:C.warn }}>보간 계산값</span>}
              </div>
            </div>
            <div style={{ padding:20 }}>
              {getDanNames(result.kansu).map((name,i)=>{
                const val=result.values[i],maxVal=Math.max(...result.values),pct=(val/maxVal)*100;
                return (<div key={i} style={{ marginBottom:i<result.values.length-1?12:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:C.primary,minWidth:72 }}>{name}</span>
                    <span style={{ fontSize:18,fontWeight:700,color:C.danColors[i]||C.accent }}>{val}<span style={{ fontSize:12,fontWeight:500 }}>cm</span></span>
                  </div>
                  <div style={{ height:8,background:C.bg,borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,background:C.danColors[i]||C.accent,borderRadius:4,transition:"width 0.4s ease-out" }}/></div>
                </div>);
              })}
            </div>
            <div style={{ margin:"0 20px 20px",padding:"14px 16px",background:"#fef9ee",border:"1px solid #f0d68a",borderRadius:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div><div style={{ fontSize:12,color:C.textLight,marginBottom:4 }}>실패 개수 (비고)</div><div style={{ fontSize:20,fontWeight:700,color:C.primary }}>{result.failureCount}개</div></div>
                <div style={{ textAlign:"right",fontSize:12,color:C.textLight,lineHeight:1.6 }}>가로 {result.width}cm → {result.width<=130?"~130cm 기준 (2개)":"131~200cm 기준 (3개)"}</div>
              </div>
            </div>
            <div style={{ padding:"0 20px 20px" }}>
              <div style={{ border:`1.5px solid ${C.border}`,borderRadius:8,overflow:"hidden",background:C.bg }}>
                {getDanNames(result.kansu).slice().reverse().map((name,ri)=>{
                  const i=result.values.length-1-ri,val=result.values[i],hPct=(val/totalSum)*100;
                  return (<div key={i} style={{ height:`${Math.max(hPct*2.2,28)}px`,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:ri<result.values.length-1?`1px dashed ${C.border}`:"none",fontSize:12,color:C.primary,fontWeight:500,gap:8 }}>
                    <span style={{ color:C.textLight }}>{name}</span><span style={{ fontWeight:700 }}>{val}cm</span>
                  </div>);
                })}
              </div>
            </div>
          </div>
        )}
        <div style={{ background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden" }}>
          <button onClick={()=>setShowTable(!showTable)} style={{ width:"100%",padding:"14px 20px",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14,fontWeight:600,color:C.primary }}>
            <span>전체 사이즈 테이블 (120~260cm, 1cm 단위)</span><span style={{ transform:showTable?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",fontSize:12 }}>▼</span>
          </button>
          {showTable && (<div style={{ borderTop:`1px solid ${C.border}`,overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,whiteSpace:"nowrap" }}>
              <thead><tr style={{ background:C.bg }}><th style={thStyle}>세로</th><th style={thStyle}>칸</th><th style={thStyle}>1단</th><th style={thStyle}>2단</th><th style={thStyle}>3단</th><th style={thStyle}>4단</th><th style={thStyle}>5단</th><th style={thStyle}>6단</th></tr></thead>
              <tbody>{fullTable.map((row)=>(<tr key={row.size} style={{ background:row.isExact?C.accentLight:"transparent",borderBottom:`1px solid ${C.border}` }}>
                <td style={{ ...tdStyle,fontWeight:600 }}>{row.size}</td><td style={tdStyle}>{row.kansu}</td>
                {[0,1,2,3,4,5].map((di)=>(<td key={di} style={{ ...tdStyle,color:di<row.values.length?C.text:"#ddd" }}>{di<row.values.length?row.values[di]:"—"}</td>))}
              </tr>))}</tbody>
            </table>
          </div>)}
        </div>
        {showTable && (<div style={{ marginTop:10,display:"flex",gap:16,justifyContent:"center",fontSize:11,color:C.textLight }}>
          <span style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:12,height:12,borderRadius:3,background:C.accentLight,display:"inline-block",border:`1px solid ${C.border}` }}/>기준 데이터</span>
          <span style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:12,height:12,borderRadius:3,background:"#fff",display:"inline-block",border:`1px solid ${C.border}` }}/>보간 계산값</span>
        </div>)}
        <div style={{ marginTop:20,padding:"16px 20px",background:C.card,borderRadius:12,border:`1px solid ${C.border}`,fontSize:12,color:C.textLight,lineHeight:1.7 }}>
          <div style={{ fontWeight:600,color:C.primary,marginBottom:6,fontSize:13 }}>계산 방식</div>
          <div>• 5cm 단위 기준 데이터 사이의 값은 <b style={{ color:C.text }}>선형 보간법</b>으로 산출<br/>• 모든 결과는 <b style={{ color:C.text }}>0.5cm 단위</b>로 반올림<br/>• ~150cm → 4칸 / 151~220cm → 5칸 / 221cm~ → 6칸<br/>• 실패 개수: 가로 ~130cm → 2개 / 가로 131~200cm → 3개</div>
        </div>
        <div style={{ marginTop:16,textAlign:"center",fontSize:11,color:C.textLight }}>마리하우스 로만쉐이드 제작 기준표</div>
      </div>
    </div>
  );
}

const inputStyle={width:"100%",padding:"12px 44px 12px 16px",fontSize:18,fontWeight:600,border:"1.5px solid #e8e2d8",borderRadius:8,outline:"none",background:"#f8f7f4",color:"#2c3e50",boxSizing:"border-box",transition:"border-color 0.2s"};
const unitStyle={position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#888",fontWeight:500};
const thStyle={padding:"10px 8px",textAlign:"center",fontWeight:600,color:"#2c3e50",borderBottom:"2px solid #e8e2d8",fontSize:11};
const tdStyle={padding:"8px",textAlign:"center",fontSize:12};
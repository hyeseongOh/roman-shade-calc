import { useState, useMemo } from "react";

const DATA = {
  4: { range:[120,150], points:[
    {size:120,values:[21.5,37,31,30.5]},{size:125,values:[22.5,39,33,30.5]},{size:130,values:[23.5,41,35,30.5]},
    {size:135,values:[24.5,43,37,33]},{size:140,values:[25,44,38,33]},{size:145,values:[25.5,45,39,35.5]},{size:150,values:[26.5,47,41,35.5]}
  ]},
  5: { range:[151,220], points:[
    {size:155,values:[24,42,36,30,23]},{size:160,values:[24.5,43,37,31,24.5]},{size:165,values:[25,44,38,32,26]},
    {size:170,values:[25.5,45,39,33,27.5]},{size:175,values:[26,46,40,34,29]},{size:180,values:[26.5,47,41,35,30.5]},
    {size:185,values:[27,48,42,36,32]},{size:190,values:[27.5,49,43,37,33.5]},{size:195,values:[28,50,44,38,35]},
    {size:200,values:[28.5,51,45,39,36.5]},{size:205,values:[29,52,46,40,38]},{size:210,values:[30,54,48,42,36]},
    {size:215,values:[30.5,55,49,43,37.5]},{size:220,values:[31,56,50,44,39]}
  ]},
  6: { range:[221,260], points:[
    {size:225,values:[28.5,51,45,39,33,28.5]},{size:230,values:[29,52,46,40,34,29]},{size:235,values:[29.5,53,47,41,35,29.5]},
    {size:240,values:[30,54,48,42,36,30]},{size:245,values:[30.5,55,49,43,37,30.5]},{size:250,values:[31,56,50,44,38,31]},
    {size:255,values:[31.5,57,51,45,39,31.5]},{size:260,values:[32,58,52,46,40,32]}
  ]}
};

const LANG = {
  ko: {
    subtitle:"Roman Shade", title:"로만쉐이드 제작 사이즈 계산기",
    desc:"가로·세로 사이즈를 입력하면 각 단별 제작 사이즈와 실패 개수를 자동 산출합니다",
    widthLabel:"가로 사이즈", heightLabel:"세로 사이즈 (120~260cm)",
    widthPh:"예: 150", heightPh:"예: 137", calcBtn:"계산하기", resetBtn:"초기화",
    errWidth:"가로 사이즈를 올바르게 입력해주세요.", errHeight:"세로 사이즈는 120~260cm 범위로 입력해주세요.", errRange:"계산할 수 없는 범위입니다.",
    width:"가로", height:"세로", kan:"칸", danSum:"단 합계", interpolated:"보간 계산값",
    failLabel:"실패 개수 (비고)", failUnit:"개", failRule1:"~130cm 기준", failRule2:"131~199cm 기준",
    sectionTitle:"단면도",
    tableBtn:"전체 사이즈 테이블 (120~260cm, 1cm 단위)", baseData:"기준 데이터", interpData:"보간 계산값",
    methodTitle:"계산 방식",
    method1:"5cm 단위 기준 데이터 사이의 값은", method1b:"선형 보간법", method1c:"으로 산출",
    method2:"모든 결과는", method2b:"0.5cm 단위", method2c:"로 반올림",
    method3:"~150cm → 4칸 / 151~220cm → 5칸 / 221cm~ → 6칸",
    method4:"실패 개수: 가로 ~130cm → 2개 / 가로 131~199cm → 3개",
    footer:"마리하우스 로만쉐이드 제작 기준표",
    danBottom:"하단", danTop:"상단", dan:"단", thHeight:"세로", thKan:"칸",
  },
  zh: {
    subtitle:"Roman Shade", title:"罗马帘制作尺寸计算器",
    desc:"输入宽度和高度，自动计算各段制作尺寸和穿绳数量",
    widthLabel:"宽度", heightLabel:"高度 (120~260cm)",
    widthPh:"例: 150", heightPh:"例: 137", calcBtn:"计算", resetBtn:"重置",
    errWidth:"请正确输入宽度。", errHeight:"高度请输入120~260cm范围。", errRange:"超出可计算范围。",
    width:"宽", height:"高", kan:"格", danSum:"段合计", interpolated:"插值计算",
    failLabel:"穿绳数量 (备注)", failUnit:"个", failRule1:"~130cm 标准", failRule2:"131~199cm 标准",
    sectionTitle:"截面图",
    tableBtn:"全部尺寸表 (120~260cm, 1cm单位)", baseData:"基准数据", interpData:"插值数据",
    methodTitle:"计算方式",
    method1:"5cm单位基准数据之间的值通过", method1b:"线性插值法", method1c:"计算",
    method2:"所有结果以", method2b:"0.5cm单位", method2c:"四舍五入",
    method3:"~150cm → 4格 / 151~220cm → 5格 / 221cm~ → 6格",
    method4:"穿绳数量: 宽 ~130cm → 2个 / 宽 131~199cm → 3个",
    footer:"MARYHOUSE 罗马帘制作标准表",
    danBottom:"底", danTop:"顶", dan:"段", thHeight:"高度", thKan:"格",
  }
};

function roundHalf(n){return Math.round(n*2)/2;}
function getKansu(h){if(h<120)return null;if(h<=150)return 4;if(h<=220)return 5;if(h>=221)return 6;return null;}
function getFailureCount(w){if(w<=130)return 2;if(w<=199)return 3;return 3;}

// 최대잔여법: 반올림 후 합계가 목표와 다르면 오차가 큰 값부터 0.5씩 보정
function adjustToTarget(rawValues, targetSum) {
  const rounded = rawValues.map(v => roundHalf(v));
  let currentSum = rounded.reduce((a, b) => a + b, 0);
  let diff = Math.round((targetSum - currentSum) * 2) / 2; // 0.5 단위 차이

  if (diff === 0) return rounded;

  // 각 값의 반올림 잔여량 계산 (원래값 - 반올림값)
  const remainders = rawValues.map((raw, i) => ({
    index: i,
    remainder: raw - rounded[i], // 양수면 내림됨, 음수면 올림됨
  }));

  if (diff > 0) {
    // 합이 부족 → 내림된 정도가 큰 순서대로 0.5씩 올림
    remainders.sort((a, b) => b.remainder - a.remainder);
    for (let j = 0; diff > 0 && j < remainders.length; j++) {
      rounded[remainders[j].index] += 0.5;
      diff -= 0.5;
    }
  } else {
    // 합이 초과 → 올림된 정도가 큰 순서대로 0.5씩 내림
    remainders.sort((a, b) => a.remainder - b.remainder);
    for (let j = 0; diff < 0 && j < remainders.length; j++) {
      rounded[remainders[j].index] -= 0.5;
      diff += 0.5;
    }
  }

  return rounded;
}

function interpolate(height){
  const kansu=getKansu(height);if(!kansu)return null;
  const data=DATA[kansu];if(!data)return null;const points=data.points;
  const exact=points.find(p=>p.size===height);
  if(exact)return{kansu,values:exact.values,isExact:true};
  let lower=null,upper=null;
  for(let i=0;i<points.length-1;i++){if(height>=points[i].size&&height<=points[i+1].size){lower=points[i];upper=points[i+1];break;}}
  if(!lower||!upper){if(height>points[points.length-1].size){lower=points[points.length-2];upper=points[points.length-1];}else if(height<points[0].size){lower=points[0];upper=points[1];}}
  if(!lower||!upper)return null;
  const ratio=(height-lower.size)/(upper.size-lower.size);
  const rawValues=lower.values.map((v,i)=>v+(upper.values[i]-v)*ratio);
  // 합계가 목표 높이와 일치하도록 최대잔여법 보정 적용
  const values = adjustToTarget(rawValues, height);
  return{kansu,values,isExact:false};
}

function getDanNames(kansu,t){const n=[];for(let i=1;i<=kansu;i++){if(i===1)n.push(`${t.danBottom} 1${t.dan}`);else if(i===kansu)n.push(`${t.danTop} ${i}${t.dan}`);else n.push(`${i}${t.dan}`);}return n;}

const C={bg:"#f8f7f4",card:"#ffffff",primary:"#2c3e50",accent:"#c0956c",accentLight:"#f0e6d8",border:"#e8e2d8",text:"#333",textLight:"#888",warn:"#c4883a",error:"#b91c1c",errorBg:"#fef2f2",errorBorder:"#fecaca"};

const FABRIC_COLORS_MAP={
  4:["#dcc8b0","#c9b49c","#b8a08a","#a68c78"],
  5:["#e0d0bc","#d2bea8","#c4ac94","#b69a82","#a88870"],
  6:["#e4d6c4","#d8c6b0","#ccb69c","#c0a688","#b49674","#a88662"],
};

function getCordPositions(cordCount){
  if(cordCount===2)return[30,70];
  if(cordCount===3)return[22,50,78];
  return[30,70];
}

function RomanShadeDiagram({danNames,values,totalSum,cordCount}){
  const kansu=values.length;
  const fabricColors=FABRIC_COLORS_MAP[kansu]||FABRIC_COLORS_MAP[6];
  const reversed=danNames.slice().reverse();
  const cordPositions=getCordPositions(cordCount);

  return(
    <div style={{position:"relative",padding:"0 30px"}}>
      <div style={{background:"linear-gradient(180deg, #6b6b6b 0%, #4a4a4a 40%, #3a3a3a 100%)",height:18,borderRadius:"4px 4px 0 0",boxShadow:"0 3px 6px rgba(0,0,0,0.25)",position:"relative",zIndex:10}}>
        <div style={{position:"absolute",left:8,top:4,right:8,height:3,background:"rgba(255,255,255,0.15)",borderRadius:2}}/>
        <div style={{position:"absolute",left:-8,top:-4,width:6,height:26,background:"#555",borderRadius:2,boxShadow:"1px 0 3px rgba(0,0,0,0.2)"}}/>
        <div style={{position:"absolute",right:-8,top:-4,width:6,height:26,background:"#555",borderRadius:2,boxShadow:"-1px 0 3px rgba(0,0,0,0.2)"}}/>
      </div>
      <div style={{position:"relative",border:"1px solid #c8b8a4",borderTop:"none",borderRadius:"0 0 3px 3px",overflow:"hidden"}}>
        {cordPositions.map((pos,ci)=>(<div key={`cord-${ci}`} style={{position:"absolute",left:`${pos}%`,top:0,bottom:0,width:1,background:"rgba(0,0,0,0.1)",zIndex:5}}/>))}
        {reversed.map((name,ri)=>{
          const i=values.length-1-ri;const val=values[i];const hPct=(val/totalSum)*100;
          const h=Math.max(hPct*3.8,44);const color=fabricColors[ri%fabricColors.length];const isLast=ri===values.length-1;
          return(<div key={i} style={{position:"relative",height:`${h}px`}}>
            <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg, ${color} 0%, ${color} 70%, ${adjustColor(color,-15)} 100%)`}}/>
            <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(90deg, transparent 0px, transparent 18px, rgba(255,255,255,0.06) 18px, rgba(255,255,255,0.06) 19px)"}}/>
            {!isLast&&(<div style={{position:"absolute",bottom:0,left:0,right:0,height:12,background:"linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 60%, rgba(0,0,0,0.15) 100%)",zIndex:2}}/>)}
            {ri>0&&(<div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",zIndex:2}}/>)}
            <div style={{position:"relative",zIndex:3,height:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px"}}>
              <span style={{fontSize:13,fontWeight:600,color:"rgba(60,40,20,0.85)",textShadow:"0 1px 0 rgba(255,255,255,0.3)"}}>{name}</span>
              <span style={{fontSize:17,fontWeight:800,color:"rgba(60,40,20,0.9)",textShadow:"0 1px 0 rgba(255,255,255,0.3)"}}>{val}<span style={{fontSize:11,fontWeight:500}}>cm</span></span>
            </div>
            {!isLast&&cordPositions.map((pos,ci)=>(<div key={`knot-${ri}-${ci}`} style={{position:"absolute",bottom:-3,left:`calc(${pos}% - 3px)`,width:7,height:7,borderRadius:"50%",background:"#b0a090",border:"1px solid #998070",zIndex:6}}/>))}
          </div>);
        })}
        <div style={{height:6,background:"linear-gradient(180deg, #8a7a6a 0%, #6a5a4a 100%)",boxShadow:"0 2px 4px rgba(0,0,0,0.15)"}}/>
      </div>
      <div style={{position:"absolute",right:-28,top:18,bottom:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:1,flex:1,background:"#bbb"}}/>
        <div style={{padding:"4px 0",fontSize:10,color:C.textLight,fontWeight:600,writingMode:"vertical-rl",letterSpacing:1}}>{roundHalf(totalSum)}cm</div>
        <div style={{width:1,flex:1,background:"#bbb"}}/>
      </div>
    </div>
  );
}

function adjustColor(hex,amt){
  let c=hex.replace("#","");
  let r=Math.max(0,Math.min(255,parseInt(c.substring(0,2),16)+amt));
  let g=Math.max(0,Math.min(255,parseInt(c.substring(2,4),16)+amt));
  let b=Math.max(0,Math.min(255,parseInt(c.substring(4,6),16)+amt));
  return`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

export default function RomanShadeCalculator(){
  const[width,setWidth]=useState("");
  const[height,setHeight]=useState("");
  const[result,setResult]=useState(null);
  const[showTable,setShowTable]=useState(false);
  const[lang,setLang]=useState("ko");
  const t=LANG[lang];
  const canCalc=width!==""&&height!=="";

  const handleCalc=()=>{
    const w=parseFloat(width),h=parseFloat(height);
    if(isNaN(w)||w<=0){setResult({error:t.errWidth});return;}
    if(isNaN(h)||h<120||h>260){setResult({error:t.errHeight});return;}
    const res=interpolate(h);
    if(!res){setResult({error:t.errRange});return;}
    setResult({...res,height:h,width:w,failureCount:getFailureCount(w)});
  };
  const handleKey=e=>{if(e.key==="Enter"&&canCalc)handleCalc();};
  const handleReset=()=>{setWidth("");setHeight("");setResult(null);};

  const fullTable=useMemo(()=>{const rows=[];for(let s=120;s<=260;s++){const res=interpolate(s);if(res)rows.push({size:s,...res});}return rows;},[]);
  const totalSum=result&&!result.error?result.values.reduce((a,b)=>a+b,0):0;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Pretendard',-apple-system,sans-serif",color:C.text,padding:"24px 16px"}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16,gap:6}}>
          <button onClick={()=>setLang("ko")} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:lang==="ko"?`2px solid ${C.accent}`:`1px solid ${C.border}`,background:lang==="ko"?C.accentLight:C.card,cursor:"pointer",fontSize:13,fontWeight:lang==="ko"?600:400,color:C.primary}}>
            <span style={{fontSize:16}}>🇰🇷</span> 한국어
          </button>
          <button onClick={()=>setLang("zh")} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:lang==="zh"?`2px solid ${C.accent}`:`1px solid ${C.border}`,background:lang==="zh"?C.accentLight:C.card,cursor:"pointer",fontSize:13,fontWeight:lang==="zh"?600:400,color:C.primary}}>
            <span style={{fontSize:16}}>🇨🇳</span> 中文
          </button>
        </div>

        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:13,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>{t.subtitle}</div>
          <h1 style={{fontSize:22,fontWeight:700,color:C.primary,margin:0,lineHeight:1.4}}>{t.title}</h1>
          <p style={{fontSize:13,color:C.textLight,marginTop:8}}>{t.desc}</p>
        </div>

        <div style={{background:C.card,borderRadius:12,padding:"24px 20px",border:`1px solid ${C.border}`,marginBottom:20}}>
          <label style={{fontSize:13,fontWeight:600,color:C.primary,display:"block",marginBottom:8}}>{t.widthLabel}</label>
          <div style={{position:"relative",marginBottom:16}}><input type="number" value={width} onChange={e=>setWidth(e.target.value)} onKeyDown={handleKey} placeholder={t.widthPh} min={1} step={0.5} style={inputStyle} onFocus={e=>(e.target.style.borderColor=C.accent)} onBlur={e=>(e.target.style.borderColor=C.border)}/><span style={unitStyle}>cm</span></div>
          <label style={{fontSize:13,fontWeight:600,color:C.primary,display:"block",marginBottom:8}}>{t.heightLabel}</label>
          <div style={{position:"relative",marginBottom:20}}><input type="number" value={height} onChange={e=>setHeight(e.target.value)} onKeyDown={handleKey} placeholder={t.heightPh} min={120} max={260} step={0.5} style={inputStyle} onFocus={e=>(e.target.style.borderColor=C.accent)} onBlur={e=>(e.target.style.borderColor=C.border)}/><span style={unitStyle}>cm</span></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleCalc} disabled={!canCalc} style={{flex:1,padding:"13px 0",background:canCalc?C.primary:"#ccc",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:canCalc?"pointer":"not-allowed"}} onMouseEnter={e=>{if(canCalc)e.target.style.opacity="0.85";}} onMouseLeave={e=>(e.target.style.opacity="1")}>{t.calcBtn}</button>
            <button onClick={handleReset} style={{padding:"13px 20px",background:"none",color:C.textLight,border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer"}}>{t.resetBtn}</button>
          </div>
        </div>

        {result?.error&&typeof result.error==="string"&&(<div style={{background:C.errorBg,border:`1px solid ${C.errorBorder}`,borderRadius:10,padding:"16px 20px",marginBottom:20,fontSize:14,color:C.error}}>{result.error}</div>)}

        {result&&!result.error&&(()=>{
          const danNames=getDanNames(result.kansu,t);
          return(
          <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:20}}>
            <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,color:C.textLight}}>{t.width}</span><span style={{fontSize:22,fontWeight:700,color:C.primary}}>{result.width}cm</span>
                  <span style={{fontSize:14,color:C.textLight,margin:"0 4px"}}>×</span>
                  <span style={{fontSize:14,color:C.textLight}}>{t.height}</span><span style={{fontSize:22,fontWeight:700,color:C.primary}}>{result.height}cm</span>
                </div>
                <span style={{fontSize:13,color:C.accent,fontWeight:600,background:C.accentLight,padding:"3px 10px",borderRadius:20}}>{result.kansu}{t.kan}</span>
              </div>
              <div style={{display:"flex",gap:16,fontSize:13,color:C.textLight}}>
                <span>{t.danSum}: <b style={{color:C.text}}>{roundHalf(totalSum)}cm</b></span>
                {!result.isExact&&<span style={{color:C.warn}}>{t.interpolated}</span>}
              </div>
            </div>

            <div style={{margin:"20px 20px 0",padding:"14px 16px",background:"#fef9ee",border:"1px solid #f0d68a",borderRadius:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:12,color:C.textLight,marginBottom:4}}>{t.failLabel}</div><div style={{fontSize:20,fontWeight:700,color:C.primary}}>{result.failureCount}{t.failUnit}</div></div>
                <div style={{textAlign:"right",fontSize:12,color:C.textLight,lineHeight:1.6}}>{t.width} {result.width}cm → {result.width<=130?`${t.failRule1} (2${t.failUnit})`:`${t.failRule2} (3${t.failUnit})`}</div>
              </div>
            </div>

            <div style={{padding:"20px 20px 24px"}}>
              <div style={{fontSize:13,fontWeight:600,color:C.primary,marginBottom:14}}>{t.sectionTitle}</div>
              <RomanShadeDiagram danNames={danNames} values={result.values} totalSum={totalSum} cordCount={result.failureCount}/>
            </div>
          </div>
          );
        })()}

        <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <button onClick={()=>setShowTable(!showTable)} style={{width:"100%",padding:"14px 20px",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14,fontWeight:600,color:C.primary}}>
            <span>{t.tableBtn}</span><span style={{transform:showTable?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",fontSize:12}}>▼</span>
          </button>
          {showTable&&(<div style={{borderTop:`1px solid ${C.border}`,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,whiteSpace:"nowrap"}}>
              <thead><tr style={{background:C.bg}}><th style={thStyle}>{t.thHeight}</th><th style={thStyle}>{t.thKan}</th><th style={thStyle}>1{t.dan}</th><th style={thStyle}>2{t.dan}</th><th style={thStyle}>3{t.dan}</th><th style={thStyle}>4{t.dan}</th><th style={thStyle}>5{t.dan}</th><th style={thStyle}>6{t.dan}</th></tr></thead>
              <tbody>{fullTable.map(row=>(<tr key={row.size} style={{background:row.isExact?C.accentLight:"transparent",borderBottom:`1px solid ${C.border}`}}>
                <td style={{...tdStyle,fontWeight:600}}>{row.size}</td><td style={tdStyle}>{row.kansu}</td>
                {[0,1,2,3,4,5].map(di=>(<td key={di} style={{...tdStyle,color:di<row.values.length?C.text:"#ddd"}}>{di<row.values.length?row.values[di]:"—"}</td>))}
              </tr>))}</tbody>
            </table>
          </div>)}
        </div>
        {showTable&&(<div style={{marginTop:10,display:"flex",gap:16,justifyContent:"center",fontSize:11,color:C.textLight}}>
          <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:3,background:C.accentLight,display:"inline-block",border:`1px solid ${C.border}`}}/>{t.baseData}</span>
          <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:3,background:"#fff",display:"inline-block",border:`1px solid ${C.border}`}}/>{t.interpData}</span>
        </div>)}

        <div style={{marginTop:20,padding:"16px 20px",background:C.card,borderRadius:12,border:`1px solid ${C.border}`,fontSize:12,color:C.textLight,lineHeight:1.7}}>
          <div style={{fontWeight:600,color:C.primary,marginBottom:6,fontSize:13}}>{t.methodTitle}</div>
          <div>• {t.method1} <b style={{color:C.text}}>{t.method1b}</b>{t.method1c}<br/>• {t.method2} <b style={{color:C.text}}>{t.method2b}</b>{t.method2c}<br/>• {t.method3}<br/>• {t.method4}</div>
        </div>
        <div style={{marginTop:16,textAlign:"center",fontSize:11,color:C.textLight}}>{t.footer}</div>
      </div>
    </div>
  );
}

const inputStyle={width:"100%",padding:"12px 44px 12px 16px",fontSize:18,fontWeight:600,border:"1.5px solid #e8e2d8",borderRadius:8,outline:"none",background:"#f8f7f4",color:"#2c3e50",boxSizing:"border-box",transition:"border-color 0.2s"};
const unitStyle={position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#888",fontWeight:500};
const thStyle={padding:"10px 8px",textAlign:"center",fontWeight:600,color:"#2c3e50",borderBottom:"2px solid #e8e2d8",fontSize:11};
const tdStyle={padding:"8px",textAlign:"center",fontSize:12};

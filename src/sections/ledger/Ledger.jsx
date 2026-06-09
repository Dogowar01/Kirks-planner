import { useState, useEffect, useMemo } from 'react';
import ARTWORK_IMG from '../../assets/ledger-artwork.jpg';

// ─── DATA HELPERS ────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = {
  Signal9: ["Print Sale", "Market Stall", "Commission", "Materials", "Printing", "Market Fees", "Packaging", "Marketing", "Other"],
  "App Sales": ["Subscription", "One-time Purchase", "License", "Hosting", "Domain", "Software", "Marketing", "Contractor", "Other"],
};

const STORAGE_KEY = "ledger_v4";
const fmt = (n) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);
const getFY = (d) => { const dt = new Date(d), y = dt.getFullYear(), m = dt.getMonth(); return m >= 6 ? `FY${y}/${y+1}` : `FY${y-1}/${y}`; };
const currentFY = () => getFY(today());
const getMonthKey = (d) => d.slice(0, 7);

function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

function exportCSV(txns, biz) {
  const rows = [["Date","Type","Description","Category","Amount (AUD)","Notes"]];
  [...txns].sort((a,b) => a.date.localeCompare(b.date)).forEach(t =>
    rows.push([t.date, t.type==="in"?"Income":"Expense", `"${t.description}"`, t.category, t.type==="in"?t.amount:-t.amount, `"${t.notes||""}"`])
  );
  const blob = new Blob([rows.map(r=>r.join(",")).join("\n")], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${biz.replace(/\s+/g,"_")}_${today()}.csv`; a.click();
}

// ─── THEMES ──────────────────────────────────────────────────────────────────

const THEMES = {
  Signal9: {
    id: "s9",
    font: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
    bg: "#0e0b08",
    surface: "rgba(14,11,8,0.72)",
    surfaceStrong: "rgba(10,8,6,0.82)",
    border: "rgba(196,90,26,0.28)",
    borderHover: "rgba(224,112,32,0.65)",
    accent: "#e07020",
    accentDim: "rgba(224,112,32,0.1)",
    textPrimary: "#f0ede8",
    textSec: "#9a8070",
    textDim: "#4a3a28",
    income: "#7ab8d0",
    incomeText: "#a8d8ee",
    expense: "#c45a1a",
    expenseText: "#e08040",
    incomeActive: { background:"rgba(122,184,208,0.12)", border:"1px solid #7ab8d0", color:"#a8d8ee" },
    expenseActive: { background:"rgba(196,90,26,0.14)", border:"1px solid #c45a1a", color:"#e08040" },
  },
  "App Sales": {
    id: "ap",
    font: "'Courier New', 'Courier', monospace",
    bg: "#020810",
    surface: "rgba(4,16,32,0.9)",
    surfaceStrong: "rgba(2,8,20,0.96)",
    border: "rgba(0,180,255,0.2)",
    borderHover: "rgba(0,255,200,0.6)",
    accent: "#00e5ff",
    accentDim: "rgba(0,229,255,0.08)",
    textPrimary: "#c8f0ff",
    textSec: "#4a8aaa",
    textDim: "#1a3a50",
    income: "#00ff9d",
    incomeText: "#00ff9d",
    expense: "#ff4d6a",
    expenseText: "#ff4d6a",
    incomeActive: { background:"rgba(0,255,157,0.08)", border:"1px solid #00ff9d", color:"#00ff9d" },
    expenseActive: { background:"rgba(255,77,106,0.08)", border:"1px solid #ff4d6a", color:"#ff4d6a" },
  },
};

// ─── SIGNAL9 BACKGROUND ──────────────────────────────────────────────────────

const S9Background = () => (
  <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
    <div style={{
      position:"absolute",inset:0,
      backgroundImage:`url(${ARTWORK_IMG})`,
      backgroundSize:"cover",
      backgroundPosition:"55% center",
      backgroundRepeat:"no-repeat",
      filter:"brightness(0.42) saturate(0.85)",
    }}/>
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="s9vig" cx="52%" cy="42%" r="62%">
          <stop offset="45%" stopColor="transparent"/>
          <stop offset="100%" stopColor="#090705" stopOpacity="0.78"/>
        </radialGradient>
        <linearGradient id="s9vtop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#090705" stopOpacity="0.65"/>
          <stop offset="18%" stopColor="#090705" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="s9vbot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="72%" stopColor="#090705" stopOpacity="0"/>
          <stop offset="100%" stopColor="#090705" stopOpacity="0.88"/>
        </linearGradient>
      </defs>
      <rect width="800" height="900" fill="url(#s9vig)"/>
      <rect width="800" height="900" fill="url(#s9vtop)"/>
      <rect width="800" height="900" fill="url(#s9vbot)"/>
    </svg>
  </div>
);

// ─── APP SALES BACKGROUND ────────────────────────────────────────────────────

const APBackground = () => {
  const cols = 28, rows = 36;
  const cells = useMemo(() => {
    const arr = [];
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const o = Math.random() < 0.06 ? (Math.random()*0.28+0.05) : 0;
      if (o > 0) arr.push({x: c*(800/cols), y: r*(900/rows), o});
    }
    return arr;
  }, []);
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}} viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="apbg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#041428"/><stop offset="100%" stopColor="#020810"/>
        </radialGradient>
        <radialGradient id="apg1" cx="80%" cy="15%" r="35%">
          <stop offset="0%" stopColor="#003355" stopOpacity="0.8"/><stop offset="100%" stopColor="#020810" stopOpacity="0"/>
        </radialGradient>
        <filter id="apblur"><feGaussianBlur stdDeviation="3"/></filter>
        <radialGradient id="apvig" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="transparent"/><stop offset="100%" stopColor="#020810" stopOpacity="0.7"/>
        </radialGradient>
      </defs>
      <rect width="800" height="900" fill="url(#apbg)"/>
      <rect width="800" height="900" fill="url(#apg1)"/>
      {Array.from({length:cols+1},(_,i)=><line key={`v${i}`} x1={i*(800/cols)} y1="0" x2={i*(800/cols)} y2="900" stroke="#00e5ff" strokeWidth="0.3" opacity="0.06"/>)}
      {Array.from({length:rows+1},(_,i)=><line key={`h${i}`} x1="0" y1={i*(900/rows)} x2="800" y2={i*(900/rows)} stroke="#00e5ff" strokeWidth="0.3" opacity="0.06"/>)}
      {cells.map((c,i)=><rect key={i} x={c.x+1} y={c.y+1} width={800/cols-2} height={900/rows-2} fill="#00e5ff" opacity={c.o}/>)}
      <line x1="0" y1="200" x2="800" y2="600" stroke="#00e5ff" strokeWidth="0.5" opacity="0.08"/>
      <line x1="0" y1="500" x2="800" y2="100" stroke="#00ff9d" strokeWidth="0.4" opacity="0.06"/>
      <rect x="0" y="295" width="800" height="2" fill="#00e5ff" opacity="0.12"/>
      <path d="M10,10 L10,40 M10,10 L40,10" stroke="#00e5ff" strokeWidth="1" opacity="0.3" fill="none"/>
      <path d="M790,10 L790,40 M790,10 L760,10" stroke="#00e5ff" strokeWidth="1" opacity="0.3" fill="none"/>
      <path d="M10,890 L10,860 M10,890 L40,890" stroke="#00e5ff" strokeWidth="1" opacity="0.3" fill="none"/>
      <path d="M790,890 L790,860 M790,890 L760,890" stroke="#00e5ff" strokeWidth="1" opacity="0.3" fill="none"/>
      {Array.from({length:45},(_,i)=><rect key={i} x="0" y={i*20} width="800" height="1" fill="#000" opacity="0.12"/>)}
      <rect width="800" height="900" fill="url(#apvig)"/>
    </svg>
  );
};

// ─── LANDING SIGNAL9 HALF BG ─────────────────────────────────────────────────

const S9LandingBg = () => (
  <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
    <div style={{
      position:"absolute",inset:0,
      backgroundImage:`url(${ARTWORK_IMG})`,
      backgroundSize:"cover",
      backgroundPosition:"60% center",
      filter:"brightness(0.38) saturate(0.8)",
    }}/>
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="ls9vig" cx="50%" cy="45%" r="65%">
          <stop offset="40%" stopColor="transparent"/>
          <stop offset="100%" stopColor="#090705" stopOpacity="0.72"/>
        </radialGradient>
        <linearGradient id="ls9top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#090705" stopOpacity="0.7"/>
          <stop offset="22%" stopColor="#090705" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="ls9bot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="70%" stopColor="#090705" stopOpacity="0"/>
          <stop offset="100%" stopColor="#090705" stopOpacity="0.92"/>
        </linearGradient>
        <linearGradient id="ls9edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="68%" stopColor="#090705" stopOpacity="0"/>
          <stop offset="100%" stopColor="#090705" stopOpacity="1"/>
        </linearGradient>
      </defs>
      <rect width="400" height="900" fill="url(#ls9vig)"/>
      <rect width="400" height="900" fill="url(#ls9top)"/>
      <rect width="400" height="900" fill="url(#ls9bot)"/>
      <rect width="400" height="900" fill="url(#ls9edge)"/>
    </svg>
  </div>
);

// ─── SHARED UI ────────────────────────────────────────────────────────────────

const TopBar = ({t, left, center, right}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`calc(env(safe-area-inset-top) + 0.85rem) 1rem 0.85rem`,borderBottom:`1px solid ${t.border}`,background: t.id==="ap"?"rgba(2,8,16,0.92)":"rgba(10,7,5,0.78)",position:"sticky",top:0,zIndex:20,backdropFilter:"blur(12px)",gap:"0.5rem"}}>
    {left}
    <span style={{fontSize:t.id==="ap"?"0.78rem":"0.88rem",letterSpacing:t.id==="ap"?"0.2em":"0.14em",textTransform:"uppercase",flex:1,textAlign:"center",color:t.textPrimary,fontFamily:t.font}}>{center}</span>
    {right}
  </div>
);

const BackBtn = ({t, onClick}) => (
  <button onClick={onClick} style={{background:"none",border:"none",color:t.accent,cursor:"pointer",fontSize:"0.85rem",padding:0,fontFamily:t.font,whiteSpace:"nowrap",letterSpacing:t.id==="ap"?"0.1em":"0"}}>← {t.id==="ap"?"BACK":"Back"}</button>
);

const Btn = ({t, onClick, children, style={}}) => (
  <button onClick={onClick} style={{background:"none",border:`1px solid ${t.accent}`,color:t.accent,cursor:"pointer",fontSize:"0.75rem",padding:"0.28rem 0.6rem",borderRadius:t.id==="ap"?"2px":"4px",fontFamily:t.font,letterSpacing:t.id==="ap"?"0.1em":"0",transition:"all 0.15s",...style}}>{children}</button>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function Ledger() {
  const saved = loadData();
  const [transactions, setTransactions] = useState(saved?.transactions || {"Signal9":[],"App Sales":[]});
  const [categories, setCategories] = useState(saved?.categories || DEFAULT_CATEGORIES);
  const [view, setView] = useState("landing");
  const [activeBiz, setActiveBiz] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterFY, setFilterFY] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [form, setForm] = useState({type:"in",description:"",category:"",amount:"",date:today(),notes:""});
  const [formError, setFormError] = useState("");
  const [catView, setCatView] = useState(false);
  const [newCat, setNewCat] = useState("");

  useEffect(() => { saveData({transactions, categories}); }, [transactions, categories]);

  const t = activeBiz ? THEMES[activeBiz] : THEMES.Signal9;
  const isAP = activeBiz === "App Sales";
  const bizTxns = activeBiz ? transactions[activeBiz] : [];

  const months = useMemo(() => [...new Set(bizTxns.map(tx => getMonthKey(tx.date)))].sort().reverse(), [bizTxns]);
  const fyears = useMemo(() => [...new Set(bizTxns.map(tx => getFY(tx.date)))].sort().reverse(), [bizTxns]);

  const filtered = useMemo(() => {
    let list = [...bizTxns];
    if (filterType !== "all") list = list.filter(tx => tx.type === filterType);
    if (filterMonth !== "all") list = list.filter(tx => getMonthKey(tx.date) === filterMonth);
    if (filterFY !== "all") list = list.filter(tx => getFY(tx.date) === filterFY);
    if (searchQ.trim()) { const q = searchQ.toLowerCase(); list = list.filter(tx => tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q) || (tx.notes||"").toLowerCase().includes(q)); }
    switch(sortBy) {
      case "date_asc": list.sort((a,b) => a.date.localeCompare(b.date)); break;
      case "date_desc": list.sort((a,b) => b.date.localeCompare(a.date)); break;
      case "amount_desc": list.sort((a,b) => b.amount - a.amount); break;
      case "amount_asc": list.sort((a,b) => a.amount - b.amount); break;
    }
    return list;
  }, [bizTxns, filterType, filterMonth, filterFY, searchQ, sortBy]);

  const totalIn = filtered.filter(tx => tx.type === "in").reduce((s,tx) => s+tx.amount, 0);
  const totalOut = filtered.filter(tx => tx.type === "out").reduce((s,tx) => s+tx.amount, 0);
  const net = totalIn - totalOut;

  const fyTotals = (biz) => {
    const fy = currentFY(), txns = transactions[biz].filter(tx => getFY(tx.date) === fy);
    const inn = txns.filter(tx => tx.type==="in").reduce((s,tx) => s+tx.amount, 0);
    const out = txns.filter(tx => tx.type==="out").reduce((s,tx) => s+tx.amount, 0);
    return {inn, out, net: inn-out};
  };

  const openBiz = (biz) => { setActiveBiz(biz); setFilterType("all"); setFilterMonth("all"); setFilterFY("all"); setSearchQ(""); setSortBy("date_desc"); setCatView(false); setView("list"); };
  const openAdd = () => { setEditingId(null); setForm({type:"in",description:"",category:categories[activeBiz][0],amount:"",date:today(),notes:""}); setFormError(""); setView("form"); };
  const openEdit = (tx) => { setEditingId(tx.id); setForm({type:tx.type,description:tx.description,category:tx.category,amount:String(tx.amount),date:tx.date,notes:tx.notes||""}); setFormError(""); setView("form"); };

  const submitForm = () => {
    if (!form.description.trim()) return setFormError("Please add a description.");
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) return setFormError("Please enter a valid amount.");
    if (!form.date) return setFormError("Please select a date.");
    const entry = {id:editingId||Date.now(),type:form.type,description:form.description.trim(),category:form.category,amount:amt,date:form.date,notes:form.notes.trim()};
    setTransactions(prev => ({...prev,[activeBiz]: editingId ? prev[activeBiz].map(tx => tx.id===editingId?entry:tx) : [entry,...prev[activeBiz]]}));
    setView("list");
  };

  const deleteEntry = (id) => { setTransactions(prev => ({...prev,[activeBiz]:prev[activeBiz].filter(tx=>tx.id!==id)})); setConfirmDel(null); };
  const addCat = () => { const c=newCat.trim(); if(!c||categories[activeBiz].includes(c)) return; setCategories(prev=>({...prev,[activeBiz]:[...prev[activeBiz],c]})); setNewCat(""); };
  const removeCat = (cat) => { if(categories[activeBiz].length<=1) return; setCategories(prev=>({...prev,[activeBiz]:prev[activeBiz].filter(c=>c!==cat)})); };

  const inputStyle = {
    background: isAP ? "rgba(0,20,40,0.9)" : "rgba(14,10,7,0.78)",
    border: `1px solid ${t.border}`,
    borderRadius: isAP ? "2px" : "4px",
    color: t.textPrimary,
    fontFamily: t.font,
    fontSize: "0.88rem",
    padding: "0.6rem 0.8rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: "dark",
  };
  const labelStyle = {fontSize:"0.68rem",letterSpacing:isAP?"0.2em":"0.12em",textTransform:"uppercase",color:t.textSec,marginTop:"0.9rem",marginBottom:"0.35rem",display:"block"};

  // ── LANDING ───────────────────────────────────────────────────────────────

  if (view === "landing") return (
    <div style={{minHeight:"100vh",background:"#0d0b08",fontFamily:"Georgia,serif",color:"#e8e4dc",position:"relative",overflow:"hidden"}}>
      <style>{globalCSS}</style>
      <div style={{position:"fixed",inset:0,display:"flex",zIndex:0}}>
        <div style={{flex:1,position:"relative"}}><S9LandingBg/></div>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}><APBackground/></div>
      </div>
      <div style={{position:"fixed",left:"50%",top:0,bottom:0,width:"1px",background:"linear-gradient(to bottom,transparent 5%,rgba(160,80,160,0.5) 30%,rgba(180,100,180,0.3) 50%,rgba(0,229,255,0.4) 70%,transparent 95%)",zIndex:1}}/>

      <div style={{position:"relative",zIndex:2,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`calc(env(safe-area-inset-top) + 2rem) 1.25rem calc(env(safe-area-inset-bottom) + 2rem)`}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{fontSize:"0.65rem",letterSpacing:"0.35em",textTransform:"uppercase",color:"rgba(160,130,90,0.7)",marginBottom:"0.8rem"}}>Business Ledger</div>
          <h1 style={{fontSize:"2.6rem",fontWeight:"normal",margin:0,letterSpacing:"0.12em",background:"linear-gradient(135deg,#e07020 0%,#c9a96e 45%,#00e5ff 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>LEDGER</h1>
          <div style={{fontSize:"0.62rem",letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(120,90,55,0.7)",marginTop:"0.6rem"}}>{currentFY()}</div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"1rem",width:"100%",maxWidth:"460px"}}>
          {[["Signal9","s9"],["App Sales","ap"]].map(([biz,id]) => {
            const th = THEMES[biz], fy = fyTotals(biz);
            const allI = transactions[biz].filter(tx=>tx.type==="in").reduce((s,tx)=>s+tx.amount,0);
            const allO = transactions[biz].filter(tx=>tx.type==="out").reduce((s,tx)=>s+tx.amount,0);
            const isap = id === "ap";
            return (
              <button key={biz} onClick={()=>openBiz(biz)} style={{
                background: isap
                  ? "linear-gradient(135deg, rgba(4,16,38,0.85) 0%, rgba(2,28,52,0.78) 100%)"
                  : "linear-gradient(135deg, rgba(52,18,52,0.72) 0%, rgba(28,10,28,0.62) 100%)",
                border: `1px solid ${isap?"rgba(0,229,255,0.22)":"rgba(160,80,160,0.38)"}`,
                borderRadius: isap ? "2px" : "6px",
                padding: "1.25rem",
                cursor: "pointer",
                textAlign: "left",
                color: th.textPrimary,
                width: "100%",
                backdropFilter: "blur(14px)",
                fontFamily: th.font,
                transition: "border-color 0.2s",
              }} className={`land-card-${id}`}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.85rem"}}>
                  <div>
                    <div style={{fontSize:"0.62rem",letterSpacing:isap?"0.25em":"0.15em",textTransform:"uppercase",color:th.textSec,marginBottom:"0.28rem"}}>{isap?"// APP_SALES":"Fine Art Studio"}</div>
                    <div style={{fontSize:"1.45rem",fontWeight:"normal",letterSpacing:isap?"0.08em":"0.03em"}}>{biz}</div>
                  </div>
                  <span style={{color:th.accent,opacity:0.5,fontSize:"1.1rem",marginTop:"0.1rem"}}>{isap?"›_":"↑"}</span>
                </div>
                <div style={{display:"flex",gap:"0.7rem",fontSize:"0.78rem",marginBottom:"0.55rem",flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{color:th.textDim,fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em"}}>{isap?"ALL_TIME":"All time"}</span>
                  <span style={{color:th.incomeText}}>▲ {fmt(allI)}</span>
                  <span style={{color:th.expenseText}}>▼ {fmt(allO)}</span>
                  <span style={{color:allI-allO>=0?th.incomeText:th.expenseText,fontWeight:"bold"}}>{fmt(allI-allO)}</span>
                </div>
                <div style={{borderTop:`1px solid ${th.border}`,paddingTop:"0.55rem",display:"flex",gap:"0.7rem",fontSize:"0.78rem",flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{color:th.accent,fontSize:"0.62rem",letterSpacing:"0.1em"}}>{currentFY()}</span>
                  <span style={{color:th.incomeText}}>▲ {fmt(fy.inn)}</span>
                  <span style={{color:th.expenseText}}>▼ {fmt(fy.out)}</span>
                  <span style={{color:fy.net>=0?th.incomeText:th.expenseText}}>{fmt(fy.net)}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{marginTop:"2.5rem",fontSize:"0.62rem",color:"rgba(60,40,20,0.5)",letterSpacing:"0.18em",textTransform:"uppercase"}}>Kirk's Business Tracker</div>
      </div>
    </div>
  );

  // ── INNER SCREENS ─────────────────────────────────────────────────────────

  const Bg = isAP ? APBackground : S9Background;

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:t.font,color:t.textPrimary,display:"flex",flexDirection:"column",position:"relative"}}>
      <style>{globalCSS}</style>
      <Bg/>

      {view === "list" && (
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",position:"relative",zIndex:1}}>
          <TopBar t={t}
            left={<BackBtn t={t} onClick={()=>setView("landing")}/>}
            center={isAP ? activeBiz.toUpperCase().replace(" ","_") : activeBiz}
            right={
              <div style={{display:"flex",gap:"0.4rem"}}>
                <Btn t={t} onClick={()=>setCatView(!catView)}>{isAP?"[CFG]":"⚙"}</Btn>
                <Btn t={t} onClick={()=>exportCSV(bizTxns,activeBiz)}>{isAP?"[CSV↓]":"↓ CSV"}</Btn>
                <Btn t={t} onClick={openAdd} style={{background:t.accentDim}}>{isAP?"[+_NEW]":"+ Add"}</Btn>
              </div>
            }
          />
          {isAP && <div style={{padding:"0.28rem 1rem",background:"rgba(0,229,255,0.04)",borderBottom:`1px solid ${t.border}`,fontSize:"0.62rem",color:t.textDim,letterSpacing:"0.15em",fontFamily:t.font}}>SYS:LEDGER // MODULE:APP_SALES // STATUS:ACTIVE</div>}
          {!isAP && <div style={{height:"2px",background:"linear-gradient(to right,transparent,rgba(196,90,26,0.5),rgba(122,184,208,0.25),transparent)"}}/>}

          {catView && (
            <div style={{background:t.surfaceStrong,borderBottom:`1px solid ${t.border}`,padding:"1rem",backdropFilter:"blur(12px)"}}>
              <div style={{fontSize:"0.65rem",letterSpacing:"0.2em",textTransform:"uppercase",color:t.accent,marginBottom:"0.75rem"}}>{isAP?"// CATEGORIES":"Categories"} — {activeBiz}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"0.75rem"}}>
                {categories[activeBiz].map(c => (
                  <div key={c} style={{display:"flex",alignItems:"center",background:t.accentDim,border:`1px solid ${t.border}`,borderRadius:isAP?"2px":"20px",padding:"0.18rem 0.3rem 0.18rem 0.65rem",gap:"0.3rem"}}>
                    <span style={{fontSize:"0.78rem",color:t.textSec}}>{c}</span>
                    <button onClick={()=>removeCat(c)} style={{background:"none",border:"none",color:t.textDim,cursor:"pointer",fontSize:"1rem",padding:0,lineHeight:1,fontFamily:t.font}}>×</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <input style={{...inputStyle,flex:1}} placeholder={isAP?"new_category…":"New category…"} value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()}/>
                <button onClick={addCat} style={{background:t.accentDim,border:`1px solid ${t.accent}`,color:t.accent,cursor:"pointer",padding:"0.5rem 0.9rem",borderRadius:isAP?"2px":"4px",fontFamily:t.font,fontSize:"0.82rem"}}>{isAP?"ADD":"Add"}</button>
              </div>
            </div>
          )}

          <div style={{display:"flex",background:t.surfaceStrong,borderBottom:`1px solid ${t.border}`,backdropFilter:"blur(8px)"}}>
            {[["Income",totalIn,t.incomeText],["Expenses",totalOut,t.expenseText],["Net",net,net>=0?t.incomeText:t.expenseText]].map(([label,val,col],i) => (
              <div key={label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"0.8rem 0.4rem",borderRight:i<2?`1px solid ${t.border}`:"none"}}>
                <span style={{fontSize:"0.58rem",letterSpacing:"0.15em",textTransform:"uppercase",color:t.textDim,marginBottom:"0.2rem"}}>{isAP?label.toUpperCase():label}</span>
                <span style={{fontSize:"0.88rem",color:col}}>{fmt(val)}</span>
              </div>
            ))}
          </div>

          <div style={{background:t.surface,borderBottom:`1px solid ${t.border}`,backdropFilter:"blur(6px)"}}>
            <div style={{display:"flex"}}>
              {[["all",isAP?"ALL":"All"],["in",isAP?"▲ INCOME":"▲ Income"],["out",isAP?"▼ EXPENSE":"▼ Expenses"]].map(([v,l]) => (
                <button key={v} onClick={()=>setFilterType(v)} style={{flex:1,background:"none",border:"none",borderBottom:`2px solid ${filterType===v?t.accent:"transparent"}`,color:filterType===v?t.accent:t.textDim,cursor:"pointer",padding:"0.6rem 0.3rem",fontSize:"0.74rem",letterSpacing:isAP?"0.1em":"0.03em",fontFamily:t.font,transition:"color 0.15s"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:"0.4rem",padding:"0.5rem 0.75rem 0",flexWrap:"wrap"}}>
              {[
                [filterMonth,[["all","All months"],...months.map(m=>[m,new Date(m+"-01").toLocaleDateString("en-AU",{month:"long",year:"numeric"})])],(v)=>{setFilterMonth(v);setFilterFY("all");}],
                [filterFY,[["all","All FYs"],...fyears.map(f=>[f,f])],(v)=>{setFilterFY(v);setFilterMonth("all");}],
                [sortBy,[["date_desc",isAP?"DATE↓":"Newest"],["date_asc",isAP?"DATE↑":"Oldest"],["amount_desc",isAP?"AMT↓":"Highest"],["amount_asc",isAP?"AMT↑":"Lowest"]],(v)=>setSortBy(v)],
              ].map(([val,opts,handler],i) => (
                <select key={i} value={val} onChange={e=>handler(e.target.value)} style={{...inputStyle,flex:1,minWidth:"80px",fontSize:"0.7rem",padding:"0.32rem 0.45rem"}}>
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",margin:"0.5rem 0.75rem 0.65rem",background:isAP?"rgba(0,20,40,0.9)":"rgba(12,8,5,0.78)",border:`1px solid ${t.border}`,borderRadius:isAP?"2px":"4px",padding:"0 0.75rem"}}>
              <span style={{color:t.textDim,fontSize:"1rem",marginRight:"0.5rem"}}>⊕</span>
              <input style={{flex:1,background:"none",border:"none",color:t.textPrimary,fontFamily:t.font,fontSize:"0.82rem",padding:"0.5rem 0",outline:"none"}} placeholder={isAP?"SEARCH_RECORDS…":"Search description, category, notes…"} value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
              {searchQ && <button onClick={()=>setSearchQ("")} style={{background:"none",border:"none",color:t.textDim,cursor:"pointer",fontSize:"1.1rem",padding:0,fontFamily:t.font}}>×</button>}
            </div>
          </div>

          <div style={{flex:1,padding:"0.75rem",display:"flex",flexDirection:"column",gap:"0.5rem",position:"relative",zIndex:1}}>
            {filtered.length === 0 ? (
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:t.textDim,paddingTop:"4rem",gap:"0.4rem",textAlign:"center"}}>
                <div style={{fontSize:"1.8rem",marginBottom:"0.5rem",opacity:0.3}}>{isAP?"[ ]":"✦"}</div>
                <p style={{margin:0}}>{isAP?"NO_RECORDS_FOUND":"No entries match."}</p>
                {bizTxns.length === 0 && <p style={{margin:0,fontSize:"0.75rem",opacity:0.5}}>{isAP?"PRESS [+_NEW] TO INITIALISE":"Tap + Add to record your first transaction."}</p>}
              </div>
            ) : filtered.map(tx => (
              <div key={tx.id} style={{display:"flex",alignItems:"center",background:isAP?"rgba(4,16,32,0.85)":"rgba(14,9,6,0.72)",border:`1px solid ${t.border}`,borderRadius:isAP?"2px":"5px",overflow:"hidden",gap:"0.6rem",backdropFilter:"blur(4px)"}} className="txn-card">
                <div style={{width:"4px",alignSelf:"stretch",flexShrink:0,background:tx.type==="in"?t.income:t.expense}}/>
                <div style={{flex:1,padding:"0.65rem 0.25rem 0.65rem 0",minWidth:0}}>
                  <div style={{fontSize:"0.87rem",marginBottom:"0.22rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{isAP?tx.description.toUpperCase():tx.description}</div>
                  <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:"0.63rem",background:isAP?"rgba(0,229,255,0.07)":"rgba(196,90,26,0.12)",color:t.textSec,padding:"0.1rem 0.42rem",borderRadius:isAP?"2px":"10px",border:`1px solid ${t.border}`}}>{tx.category}</span>
                    <span style={{fontSize:"0.63rem",color:t.textDim}}>{fmtDate(tx.date)}</span>
                    {tx.notes && <span style={{fontSize:"0.63rem",color:t.textDim,fontStyle:isAP?"normal":"italic"}} title={tx.notes}>{isAP?"[NOTE]":"📓"} {tx.notes.length>25?tx.notes.slice(0,25)+"…":tx.notes}</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.32rem",padding:"0.6rem 0.65rem 0.6rem 0",flexShrink:0}}>
                  <div style={{fontSize:"0.87rem",color:tx.type==="in"?t.incomeText:t.expenseText,whiteSpace:"nowrap"}}>{tx.type==="in"?"+":"−"}{fmt(tx.amount)}</div>
                  <div style={{display:"flex",gap:"0.4rem"}}>
                    <button onClick={()=>openEdit(tx)} style={{background:"none",border:"none",color:t.textDim,cursor:"pointer",fontSize:"0.85rem",padding:0,fontFamily:t.font}} title="Edit">{isAP?"[✎]":"✎"}</button>
                    <button onClick={()=>setConfirmDel(tx.id)} style={{background:"none",border:"none",color:t.textDim,cursor:"pointer",fontSize:"1rem",padding:0,lineHeight:1,fontFamily:t.font}} title="Delete">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length > 0 && (
            <div style={{textAlign:"center",fontSize:"0.65rem",color:t.textDim,padding:"0.5rem",letterSpacing:"0.08em",position:"relative",zIndex:1}}>
              {filtered.length} {isAP?"RECORD":"entr"}{filtered.length===1?(isAP?"":"y"):(isAP?"S":"ies")}{searchQ||filterType!=="all"||filterMonth!=="all"||filterFY!=="all"?" (filtered)":""}
            </div>
          )}
        </div>
      )}

      {view === "form" && (
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",position:"relative",zIndex:1}}>
          <TopBar t={t}
            left={<BackBtn t={t} onClick={()=>setView("list")}/>}
            center={isAP?(editingId?"EDIT_RECORD":"NEW_RECORD"):(editingId?"Edit Entry":"New Entry")}
            right={<span style={{fontSize:"0.68rem",color:t.textDim,letterSpacing:"0.1em"}}>{activeBiz}</span>}
          />
          {isAP && <div style={{padding:"0.28rem 1rem",background:"rgba(0,229,255,0.04)",borderBottom:`1px solid ${t.border}`,fontSize:"0.62rem",color:t.textDim,letterSpacing:"0.15em"}}>INPUT_MODE // AWAITING_DATA_ENTRY</div>}
          {!isAP && <div style={{height:"2px",background:"linear-gradient(to right,transparent,rgba(196,90,26,0.5),rgba(122,184,208,0.25),transparent)"}}/>}
          <div style={{padding:"1.25rem 1rem",display:"flex",flexDirection:"column",gap:"0.2rem",position:"relative",zIndex:1}}>
            <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem"}}>
              {[["in",isAP?"▲ INCOMING":"▲ Incoming"],["out",isAP?"▼ OUTGOING":"▼ Outgoing"]].map(([v,l]) => (
                <button key={v} onClick={()=>setForm(f=>({...f,type:v}))} style={{flex:1,background:form.type===v?(v==="in"?t.incomeActive.background:t.expenseActive.background):t.accentDim,border:form.type===v?(v==="in"?t.incomeActive.border:t.expenseActive.border):`1px solid ${t.border}`,color:form.type===v?(v==="in"?t.incomeText:t.expenseText):t.textSec,padding:"0.7rem",borderRadius:isAP?"2px":"5px",cursor:"pointer",fontFamily:t.font,fontSize:"0.85rem",letterSpacing:isAP?"0.1em":"0",transition:"all 0.15s"}}>{l}</button>
              ))}
            </div>
            <label style={labelStyle}>{isAP?"DESCRIPTION":"Description"}</label>
            <input style={inputStyle} placeholder={isAP?"e.g. APP_LICENSE_SALE":"e.g. Harvest Market print sale"} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
            <label style={labelStyle}>{isAP?"CATEGORY":"Category"}</label>
            <select style={inputStyle} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {categories[activeBiz].map(c => <option key={c}>{c}</option>)}
            </select>
            <label style={labelStyle}>{isAP?"AMOUNT_AUD":"Amount (AUD)"}</label>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
              <span style={{color:t.accent,fontSize:"1rem"}}>$</span>
              <input style={{...inputStyle,flex:1}} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <label style={labelStyle}>{isAP?"DATE":"Date"}</label>
            <input style={inputStyle} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            <label style={labelStyle}>{isAP?"NOTES // OPTIONAL":"Notes"} {!isAP&&<span style={{color:t.textDim,textTransform:"none",letterSpacing:0,fontSize:"0.68rem"}}>(optional)</span>}</label>
            <textarea style={{...inputStyle,resize:"vertical",fontFamily:t.font}} rows={3} placeholder={isAP?"// invoice_ref, client_id, context…":"Invoice number, client name, context…"} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            {formError && <p style={{color:t.expenseText,fontSize:"0.78rem",margin:"0.4rem 0 0"}}>{formError}</p>}
            <button onClick={submitForm} style={{marginTop:"1.5rem",background:t.accent,border:"none",borderRadius:isAP?"2px":"5px",color:isAP?"#020810":"#0e0a06",fontFamily:t.font,fontSize:"0.92rem",letterSpacing:isAP?"0.15em":"0.04em",padding:"0.82rem",cursor:"pointer",fontWeight:"bold"}}>{isAP?(editingId?"COMMIT_CHANGES":"SAVE_RECORD"):(editingId?"Save Changes":"Save Entry")}</button>
            {editingId && <button onClick={()=>{setConfirmDel(editingId);setView("list");}} style={{marginTop:"0.5rem",background:"none",border:`1px solid rgba(196,90,26,0.25)`,borderRadius:isAP?"2px":"5px",color:isAP?"#ff4d6a":"#8a4020",fontFamily:t.font,fontSize:"0.82rem",padding:"0.65rem",cursor:"pointer"}}>{isAP?"DELETE_RECORD":"Delete this entry"}</button>}
          </div>
        </div>
      )}

      {confirmDel && (
        <div onClick={()=>setConfirmDel(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"1rem"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:isAP?"#040f20":"#110d0a",border:`1px solid ${isAP?"rgba(255,77,106,0.4)":"rgba(196,90,26,0.3)"}`,borderRadius:isAP?"2px":"8px",padding:"2rem 1.5rem",maxWidth:"300px",width:"100%",textAlign:"center",backdropFilter:"blur(16px)"}}>
            <div style={{fontSize:"1.5rem",color:t.accent,marginBottom:"0.5rem"}}>{isAP?"⚠_":"⚠"}</div>
            <p style={{fontSize:"1rem",margin:"0 0 0.4rem",color:t.textPrimary,letterSpacing:isAP?"0.1em":"0"}}>{isAP?"CONFIRM_DELETE":"Delete entry?"}</p>
            <p style={{fontSize:"0.78rem",color:t.textSec,margin:"0 0 1.5rem"}}>{isAP?"ACTION_IRREVERSIBLE":"This cannot be undone."}</p>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,background:t.accentDim,border:`1px solid ${t.border}`,color:t.textSec,fontFamily:t.font,fontSize:"0.88rem",padding:"0.65rem",borderRadius:isAP?"2px":"5px",cursor:"pointer"}}>{isAP?"[CANCEL]":"Cancel"}</button>
              <button onClick={()=>deleteEntry(confirmDel)} style={{flex:1,background:isAP?"rgba(255,77,106,0.1)":"rgba(196,90,26,0.1)",border:`1px solid ${isAP?"rgba(255,77,106,0.5)":"rgba(196,90,26,0.4)"}`,color:isAP?"#ff4d6a":"#e08040",fontFamily:t.font,fontSize:"0.88rem",padding:"0.65rem",borderRadius:isAP?"2px":"5px",cursor:"pointer"}}>{isAP?"[DELETE]":"Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  input::placeholder, textarea::placeholder { color: #3a2818; opacity: 1; }
  input:focus, select:focus, textarea:focus { outline: none; }
  .land-card-s9:hover { border-color: rgba(200,100,200,0.65) !important; }
  .land-card-ap:hover { border-color: rgba(0,229,255,0.5) !important; }
  .txn-card:hover { border-color: rgba(196,90,26,0.4) !important; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
  select option { background: #0e0a06; }
  textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(196,90,26,0.3); border-radius: 2px; }
`;

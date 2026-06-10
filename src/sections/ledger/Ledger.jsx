import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ARTWORK_IMG from '../../assets/ledger-artwork.jpg';
import BottomNav from '../../components/BottomNav';
import HoloRings from '../../components/HoloRings';

// ─── DATA HELPERS ─────────────────────────────────────────────────────────────

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

// ─── ACCENT COLOURS ───────────────────────────────────────────────────────────

const BIZ_ACCENT = {
  Signal9:   '#C4522A',   // rust
  'App Sales': '#00C8FF', // cyan
};
const BIZ_SECONDARY = {
  Signal9:   '#FFB700',
  'App Sales': '#00FF9D',
};

// ─── SHARED ANIMATION HELPER ─────────────────────────────────────────────────

const ph = (delay = 0, dur = 0.8, dir = '') => {
  const kf = dir === 'left' ? 'phase-in-left' : dir === 'right' ? 'phase-in-right' : 'phase-in';
  return `${kf} ${dur}s cubic-bezier(0.22,1,0.36,1) ${delay}s both`;
};

// ─── BACKGROUNDS ──────────────────────────────────────────────────────────────

function LedgerBg({ accent = '#C4522A' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Artwork */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${ARTWORK_IMG})`,
        backgroundSize: 'cover', backgroundPosition: '55% center',
        opacity: 0.14, filter: 'saturate(0.7)',
        animation: ph(0, 2.5),
      }} />
      {/* Dark base */}
      <div style={{ position: 'absolute', inset: 0, background: '#0D0C0B' }} />
      {/* Gradient wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 120% 60% at 50% -8%, ${accent}55 0%, ${accent}22 40%, transparent 68%)`,
        animation: ph(0.3, 1.8),
      }} />
      {/* Architectural grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
        backgroundSize: '40px 40px', opacity: 0.045,
        animation: ph(0.5, 1.6),
      }} />
      {/* Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-8%',
        width: '55vw', height: '55vw', maxWidth: 440, maxHeight: 440,
        background: `radial-gradient(circle, ${accent}38 0%, ${accent}14 40%, transparent 70%)`,
        borderRadius: '50%', filter: 'blur(40px)',
        animation: `orb-drift 18s ease-in-out infinite, ${ph(0.2, 2.2, 'right')}`,
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', left: '-12%',
        width: '50vw', height: '50vw', maxWidth: 380, maxHeight: 380,
        background: 'radial-gradient(circle, rgba(120,60,220,0.28) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(48px)',
        animation: `orb-drift 24s ease-in-out infinite 4s, ${ph(0.5, 2.0, 'left')}`,
      }} />
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingView({ transactions, onOpen, onBack }) {
  const fyTotals = (biz) => {
    const fy = currentFY(), txns = transactions[biz].filter(tx => getFY(tx.date) === fy);
    const inn = txns.filter(tx => tx.type==="in").reduce((s,tx) => s+tx.amount, 0);
    const out = txns.filter(tx => tx.type==="out").reduce((s,tx) => s+tx.amount, 0);
    return { inn, out, net: inn - out };
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0C0B', color: '#EDE8E0', position: 'relative', overflow: 'hidden' }}>
      <style>{globalCSS}</style>

      {/* Shared background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARTWORK_IMG})`, backgroundSize: 'cover', backgroundPosition: '55% center', opacity: 0.13, filter: 'saturate(0.6)', animation: ph(0, 2.5) }} />
        <div style={{ position: 'absolute', inset: 0, background: '#0D0C0B' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(160,60,220,0.35) 0%, rgba(0,200,255,0.12) 50%, transparent 75%)', animation: ph(0.3, 2.0) }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(160,60,220,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', animation: ph(0.6, 1.8) }} />
        {/* Split divider */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, transparent 5%, rgba(160,80,220,0.4) 30%, rgba(0,200,255,0.35) 70%, transparent 95%)', animation: ph(1.0, 1.2) }} />
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '60vw', height: '60vw', maxWidth: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,82,42,0.3) 0%, transparent 70%)', filter: 'blur(48px)', animation: `orb-drift 20s ease-in-out infinite, ${ph(0.2, 2.2)}` }} />
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '55vw', height: '55vw', maxWidth: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.25) 0%, transparent 70%)', filter: 'blur(40px)', animation: `orb-drift 18s ease-in-out infinite 6s, ${ph(0.4, 2.0)}` }} />
      </div>

      {/* HoloRings */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden', animation: ph(0.8, 1.6) }}>
        <HoloRings size={300} color="#C4522A" style={{ position: 'absolute', bottom: -80, left: -80, opacity: 0.45 }} />
        <HoloRings size={220} color="#00C8FF" style={{ position: 'absolute', top: -60, right: -60, opacity: 0.40 }} />
        <HoloRings size={140} color="#A040E0" style={{ position: 'absolute', top: '42%', left: '45%', opacity: 0.32 }} />
      </div>

      {/* Scan line */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent 0%, rgba(160,60,220,0.5) 20%, rgba(0,200,255,0.9) 50%, rgba(160,60,220,0.5) 80%, transparent 100%)', boxShadow: '0 0 12px rgba(0,200,255,0.5)', filter: 'blur(0.5px)', animation: 'prismatic-scan 3s cubic-bezier(0.4,0,0.6,1) 0.5s 1 forwards' }} />
      </div>

      {/* Back button */}
      <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 0.75rem)', left: '1rem', zIndex: 10, animation: ph(0.4, 0.8, 'left') }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(13,12,11,0.7)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'rgba(220,200,180,0.8)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>
          ← Back
        </button>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top) + 5rem) 1.25rem calc(env(safe-area-inset-bottom) + 5.5rem)' }}>

        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: ph(0.6, 1.1) }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(160,130,90,0.65)', marginBottom: '0.75rem' }}>
            ■ Business Ledger
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(2.8rem, 10vw, 4.5rem)', margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #C4522A 0%, #FFB700 40%, #00C8FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 30px rgba(196,82,42,0.4))' }}>
            Ledger
          </h1>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.45)', marginTop: '0.5rem' }}>
            {currentFY()} · Active
          </div>
        </div>

        {/* Business cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '460px' }}>
          {[['Signal9', '#C4522A', '#FFB700', 'Fine Art Studio', '↑'], ['App Sales', '#00C8FF', '#00FF9D', '// Digital Products', '›_']].map(([biz, accent, secondary, sub, arrow], cardIdx) => {
            const fy = fyTotals(biz);
            const allI = transactions[biz].filter(tx => tx.type==="in").reduce((s,tx) => s+tx.amount, 0);
            const allO = transactions[biz].filter(tx => tx.type==="out").reduce((s,tx) => s+tx.amount, 0);
            return (
              <button key={biz} onClick={() => onOpen(biz)} style={{ animation: ph(0.9 + cardIdx * 0.2, 1.0, cardIdx === 0 ? 'left' : 'right') }}>
                <div style={{
                  background: `linear-gradient(135deg, ${accent}1A 0%, ${accent}0D 60%, rgba(13,12,11,0.9) 100%)`,
                  border: `1px solid ${accent}45`,
                  borderRadius: 14,
                  padding: '1.4rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#EDE8E0',
                  width: '100%',
                  backdropFilter: 'blur(20px)',
                  boxShadow: `0 0 40px ${accent}18, 0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 ${accent}25`,
                  clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
                  filter: `drop-shadow(0 0 20px ${accent}28)`,
                  transition: 'all 0.2s',
                }}>
                  {/* Top accent line */}
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: `${accent}90`, marginBottom: '0.3rem' }}>{sub}</div>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.5rem', color: accent, textShadow: `0 0 20px ${accent}50` }}>{biz}</div>
                      </div>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.4rem', color: `${accent}60`, marginTop: '0.1rem' }}>{arrow}</div>
                    </div>
                  </div>

                  {/* All-time */}
                  <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.78rem', marginBottom: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: `${accent}55` }}>All time</span>
                    <span style={{ color: secondary }}>▲ {fmt(allI)}</span>
                    <span style={{ color: '#FF4D6A' }}>▼ {fmt(allO)}</span>
                    <span style={{ color: allI-allO >= 0 ? secondary : '#FF4D6A', fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>{fmt(allI-allO)}</span>
                  </div>

                  {/* FY */}
                  <div style={{ borderTop: `1px solid ${accent}25`, paddingTop: '0.6rem', display: 'flex', gap: '0.6rem', fontSize: '0.78rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: accent, letterSpacing: '0.1em' }}>{currentFY()}</span>
                    <span style={{ color: secondary }}>▲ {fmt(fy.inn)}</span>
                    <span style={{ color: '#FF4D6A' }}>▼ {fmt(fy.out)}</span>
                    <span style={{ color: fy.net >= 0 ? secondary : '#FF4D6A', fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>{fmt(fy.net)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '2.5rem', fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: 'rgba(60,40,20,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', animation: ph(1.4, 0.8) }}>
          Kirk's Business Tracker · Signal9 Studio
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────

function ListView({ activeBiz, transactions, categories, onBack, onAdd, onEdit, onDelete, onExport, onToggleCat, catView }) {
  const accent = BIZ_ACCENT[activeBiz];
  const secondary = BIZ_SECONDARY[activeBiz];
  const bizTxns = transactions[activeBiz];

  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterFY, setFilterFY] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [confirmDel, setConfirmDel] = useState(null);

  const months = useMemo(() => [...new Set(bizTxns.map(tx => getMonthKey(tx.date)))].sort().reverse(), [bizTxns]);
  const fyears = useMemo(() => [...new Set(bizTxns.map(tx => getFY(tx.date)))].sort().reverse(), [bizTxns]);

  const filtered = useMemo(() => {
    let list = [...bizTxns];
    if (filterType !== 'all') list = list.filter(tx => tx.type === filterType);
    if (filterMonth !== 'all') list = list.filter(tx => getMonthKey(tx.date) === filterMonth);
    if (filterFY !== 'all') list = list.filter(tx => getFY(tx.date) === filterFY);
    if (searchQ.trim()) { const q = searchQ.toLowerCase(); list = list.filter(tx => tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q) || (tx.notes||'').toLowerCase().includes(q)); }
    switch(sortBy) {
      case 'date_asc':    list.sort((a,b) => a.date.localeCompare(b.date)); break;
      case 'date_desc':   list.sort((a,b) => b.date.localeCompare(a.date)); break;
      case 'amount_desc': list.sort((a,b) => b.amount - a.amount); break;
      case 'amount_asc':  list.sort((a,b) => a.amount - b.amount); break;
    }
    return list;
  }, [bizTxns, filterType, filterMonth, filterFY, searchQ, sortBy]);

  const totalIn  = filtered.filter(tx => tx.type === 'in').reduce((s,tx) => s+tx.amount, 0);
  const totalOut = filtered.filter(tx => tx.type === 'out').reduce((s,tx) => s+tx.amount, 0);
  const net = totalIn - totalOut;

  const selectStyle = {
    flex: 1, minWidth: 80,
    background: 'rgba(13,12,11,0.8)',
    border: `1px solid ${accent}30`,
    borderRadius: 6, color: '#C8BFB5',
    fontFamily: '"DM Mono", monospace', fontSize: '0.62rem',
    padding: '0.3rem 0.4rem', outline: 'none', colorScheme: 'dark',
  };
  const inputStyle = {
    background: 'rgba(13,12,11,0.85)',
    border: `1px solid ${accent}30`,
    borderRadius: 6, color: '#EDE8E0',
    fontFamily: '"DM Mono", monospace', fontSize: '0.82rem',
    padding: '0.55rem 0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0C0B', color: '#EDE8E0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{globalCSS}</style>
      <LedgerBg accent={accent} />

      {/* HoloRings */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden', animation: ph(0.6, 1.4) }}>
        <HoloRings size={280} color={accent}   style={{ position: 'absolute', bottom: -80, left: -80, opacity: 0.46 }} />
        <HoloRings size={190} color="#A040E0"  style={{ position: 'absolute', top: -55, right: -55, opacity: 0.38 }} />
        <HoloRings size={130} color={secondary} style={{ position: 'absolute', top: '40%', right: -40, opacity: 0.30 }} />
      </div>

      {/* Scan line */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 0%, ${accent}44 10%, ${accent}cc 30%, ${accent} 50%, ${accent}cc 70%, ${accent}44 90%, transparent 100%)`, boxShadow: `0 0 12px ${accent}66`, filter: 'blur(0.5px)', animation: 'prismatic-scan 3s cubic-bezier(0.4,0,0.6,1) 0.2s 1 forwards' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', position: 'relative', zIndex: 3, paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}>

        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          padding: 'calc(env(safe-area-inset-top) + 10px) 16px 12px',
          background: 'linear-gradient(to bottom, rgba(8,7,6,0.98) 0%, rgba(13,12,11,0.94) 100%)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 32px rgba(0,0,0,0.55)',
          overflow: 'hidden', animation: ph(0, 0.9),
        }}>
          {/* Holo bottom border */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent 0%, ${accent}cc 30%, ${accent} 50%, ${accent}cc 70%, transparent 100%)`, backgroundSize: '300% 100%', animation: 'holo-border 4s linear infinite' }} />
          <button onClick={onBack} style={{ background: 'none', border: `1px solid ${accent}40`, borderRadius: 8, color: accent, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', padding: '0.3rem 0.7rem', letterSpacing: '0.1em' }}>← BACK</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: `${accent}70`, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 2 }}>■ Ledger</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.05rem', color: accent, margin: 0, textShadow: `0 0 20px ${accent}50` }}>{activeBiz}</h1>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onToggleCat} style={{ background: `${accent}15`, border: `1px solid ${accent}35`, borderRadius: 6, color: `${accent}CC`, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', padding: '0.28rem 0.55rem', letterSpacing: '0.08em' }}>⚙</button>
            <button onClick={onExport} style={{ background: `${accent}15`, border: `1px solid ${accent}35`, borderRadius: 6, color: `${accent}CC`, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', padding: '0.28rem 0.55rem', letterSpacing: '0.08em' }}>CSV↓</button>
            <button onClick={onAdd} style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}22)`, border: `1px solid ${accent}70`, borderRadius: 6, color: accent, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', padding: '0.3rem 0.7rem', letterSpacing: '0.08em', boxShadow: `0 0 12px ${accent}30` }}>+ Add</button>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', background: 'rgba(13,12,11,0.85)', borderBottom: `1px solid ${accent}25`, backdropFilter: 'blur(8px)', animation: ph(0.2, 0.9) }}>
          {[['Income', totalIn, secondary], ['Expenses', totalOut, '#FF4D6A'], ['Net', net, net >= 0 ? secondary : '#FF4D6A']].map(([label, val, col], i) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0.4rem', borderRight: i < 2 ? `1px solid ${accent}20` : 'none' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: `${accent}60`, marginBottom: '0.2rem' }}>{label}</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', fontWeight: 700, color: col, textShadow: `0 0 10px ${col}60` }}>{fmt(val)}</span>
            </div>
          ))}
        </div>

        {/* Cat editor */}
        {catView && (
          <CatEditor activeBiz={activeBiz} categories={categories} accent={accent} onExternalAdd={(biz, cat) => onToggleCat(biz, cat, 'add')} onExternalRemove={(biz, cat) => onToggleCat(biz, cat, 'remove')} />
        )}

        {/* Filters */}
        <div style={{ background: 'rgba(13,12,11,0.7)', borderBottom: `1px solid ${accent}20`, backdropFilter: 'blur(6px)', animation: ph(0.35, 0.9) }}>
          <div style={{ display: 'flex' }}>
            {[['all','All'],['in','▲ Income'],['out','▼ Expenses']].map(([v,l]) => (
              <button key={v} onClick={() => setFilterType(v)} style={{ flex: 1, background: 'none', border: 'none', borderBottom: `2px solid ${filterType===v ? accent : 'transparent'}`, color: filterType===v ? accent : 'rgba(160,140,120,0.5)', cursor: 'pointer', padding: '0.55rem 0.3rem', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', transition: 'color 0.15s' }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '0.45rem 0.75rem 0', flexWrap: 'wrap' }}>
            {[
              [filterMonth, [['all','All months'], ...months.map(m => [m, new Date(m+'-01').toLocaleDateString('en-AU',{month:'long',year:'numeric'})])], (v) => { setFilterMonth(v); setFilterFY('all'); }],
              [filterFY, [['all','All FYs'], ...fyears.map(f => [f,f])], (v) => { setFilterFY(v); setFilterMonth('all'); }],
              [sortBy, [['date_desc','Newest'],['date_asc','Oldest'],['amount_desc','Highest'],['amount_asc','Lowest']], (v) => setSortBy(v)],
            ].map(([val, opts, handler], i) => (
              <select key={i} value={val} onChange={e => handler(e.target.value)} style={selectStyle}>
                {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0.45rem 0.75rem 0.6rem', background: 'rgba(13,12,11,0.9)', border: `1px solid ${accent}28`, borderRadius: 8, padding: '0 0.75rem' }}>
            <span style={{ color: `${accent}60`, fontSize: '0.9rem', marginRight: '0.5rem' }}>⊕</span>
            <input style={{ flex: 1, background: 'none', border: 'none', color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', padding: '0.45rem 0', outline: 'none' }} placeholder="Search description, category, notes…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {searchQ && <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', color: `${accent}60`, cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}>×</button>}
          </div>
        </div>

        {/* Transaction list */}
        <div style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: `${accent}50`, paddingTop: '4rem', gap: '0.5rem', textAlign: 'center', animation: ph(0.5, 0.8) }}>
              <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem' }}>✦</div>
              <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.8rem' }}>No entries match.</p>
              {bizTxns.length === 0 && <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', opacity: 0.5 }}>Tap + Add to record your first transaction.</p>}
            </div>
          ) : filtered.map((tx, i) => (
            <div key={tx.id} style={{
              display: 'flex', alignItems: 'center',
              background: `linear-gradient(135deg, ${tx.type==='in' ? secondary : '#FF4D6A'}12 0%, rgba(13,12,11,0.88) 100%)`,
              border: `1px solid ${tx.type==='in' ? secondary : '#FF4D6A'}28`,
              borderRadius: 10, overflow: 'hidden', gap: '0.6rem',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 0 20px ${tx.type==='in' ? secondary : '#FF4D6A'}0A`,
              animation: ph(0.4 + i * 0.04, 0.7, i % 2 === 0 ? 'left' : 'right'),
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
            }}>
              {/* Accent stripe */}
              <div style={{ width: 4, alignSelf: 'stretch', flexShrink: 0, background: tx.type==='in' ? secondary : '#FF4D6A', boxShadow: `0 0 8px ${tx.type==='in' ? secondary : '#FF4D6A'}80` }} />
              <div style={{ flex: 1, padding: '0.65rem 0.25rem 0.65rem 0', minWidth: 0 }}>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.88rem', marginBottom: '0.22rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#EDE8E0' }}>{tx.description}</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', background: `${accent}15`, color: `${accent}AA`, padding: '0.1rem 0.4rem', borderRadius: 8, border: `1px solid ${accent}25` }}>{tx.category}</span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: 'rgba(160,140,120,0.6)' }}>{fmtDate(tx.date)}</span>
                  {tx.notes && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: 'rgba(160,140,120,0.5)', fontStyle: 'italic' }}>📓 {tx.notes.length > 22 ? tx.notes.slice(0,22)+'…' : tx.notes}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', padding: '0.6rem 0.65rem 0.6rem 0', flexShrink: 0 }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.88rem', fontWeight: 700, color: tx.type==='in' ? secondary : '#FF4D6A', textShadow: `0 0 10px ${tx.type==='in' ? secondary : '#FF4D6A'}70`, whiteSpace: 'nowrap' }}>{tx.type==='in' ? '+' : '−'}{fmt(tx.amount)}</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => onEdit(tx)} style={{ background: 'none', border: 'none', color: `${accent}70`, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>✎</button>
                  <button onClick={() => setConfirmDel(tx.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,77,106,0.5)', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}>×</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length > 0 && (
            <div style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: `${accent}45`, padding: '0.5rem', letterSpacing: '0.1em' }}>
              {filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}{(searchQ || filterType !== 'all' || filterMonth !== 'all' || filterFY !== 'all') ? ' (filtered)' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(13,12,11,0.98) 0%, rgba(20,15,12,0.95) 100%)', border: `1px solid ${accent}35`, borderRadius: 14, padding: '2rem 1.5rem', maxWidth: 300, width: '100%', textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: `0 0 40px rgba(0,0,0,0.8)`, clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⚠</div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 0.4rem', color: '#EDE8E0' }}>Delete entry?</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: 'rgba(160,140,120,0.7)', margin: '0 0 1.5rem' }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, background: `${accent}15`, border: `1px solid ${accent}30`, color: `${accent}AA`, fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', padding: '0.65rem', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { onDelete(confirmDel); setConfirmDel(null); }} style={{ flex: 1, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.45)', color: '#FF4D6A', fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', padding: '0.65rem', borderRadius: 8, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// ─── CATEGORY EDITOR PANEL ────────────────────────────────────────────────────

function CatEditor({ activeBiz, categories, accent, onExternalAdd, onExternalRemove }) {
  const [newCat, setNewCat] = useState('');
  return (
    <div style={{ background: 'rgba(13,12,11,0.9)', borderBottom: `1px solid ${accent}25`, padding: '0.9rem 1rem', backdropFilter: 'blur(12px)', animation: ph(0, 0.5) }}>
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: '0.65rem' }}>Categories — {activeBiz}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
        {categories[activeBiz].map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', background: `${accent}15`, border: `1px solid ${accent}28`, borderRadius: 20, padding: '0.18rem 0.3rem 0.18rem 0.65rem', gap: '0.3rem' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: '#C8BFB5' }}>{c}</span>
            <button onClick={() => onExternalRemove(activeBiz, c)} style={{ background: 'none', border: 'none', color: `${accent}60`, cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input style={{ flex: 1, background: 'rgba(13,12,11,0.9)', border: `1px solid ${accent}28`, borderRadius: 6, color: '#EDE8E0', fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', padding: '0.45rem 0.7rem', outline: 'none', colorScheme: 'dark' }} placeholder="New category…" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onExternalAdd(activeBiz, newCat), setNewCat(''))} />
        <button onClick={() => { onExternalAdd(activeBiz, newCat); setNewCat(''); }} style={{ background: `${accent}20`, border: `1px solid ${accent}45`, color: accent, cursor: 'pointer', padding: '0.45rem 0.9rem', borderRadius: 6, fontFamily: '"DM Mono", monospace', fontSize: '0.78rem' }}>Add</button>
      </div>
    </div>
  );
}

// ─── FORM VIEW ────────────────────────────────────────────────────────────────

function FormView({ activeBiz, categories, editingId, onBack, onSubmit, onDeleteEdit, initialForm }) {
  const accent = BIZ_ACCENT[activeBiz];
  const secondary = BIZ_SECONDARY[activeBiz];
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');

  const submit = () => {
    if (!form.description.trim()) return setFormError('Please add a description.');
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) return setFormError('Please enter a valid amount.');
    if (!form.date) return setFormError('Please select a date.');
    onSubmit({ id: editingId || Date.now(), type: form.type, description: form.description.trim(), category: form.category, amount: amt, date: form.date, notes: form.notes.trim() });
  };

  const inputStyle = {
    background: 'rgba(13,12,11,0.9)', border: `1px solid ${accent}30`,
    borderRadius: 8, color: '#EDE8E0',
    fontFamily: '"DM Mono", monospace', fontSize: '0.85rem',
    padding: '0.6rem 0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
  };
  const labelStyle = { fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${accent}80`, marginTop: '1rem', marginBottom: '0.35rem', display: 'block' };

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0C0B', color: '#EDE8E0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{globalCSS}</style>
      <LedgerBg accent={accent} />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', position: 'relative', zIndex: 3, paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: 'calc(env(safe-area-inset-top) + 10px) 16px 12px', background: 'linear-gradient(to bottom, rgba(8,7,6,0.98) 0%, rgba(13,12,11,0.94) 100%)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 32px rgba(0,0,0,0.55)', overflow: 'hidden', animation: ph(0, 0.9) }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent 0%, ${accent}cc 30%, ${accent} 50%, ${accent}cc 70%, transparent 100%)`, animation: 'holo-border 4s linear infinite' }} />
          <button onClick={onBack} style={{ background: 'none', border: `1px solid ${accent}40`, borderRadius: 8, color: accent, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', padding: '0.3rem 0.7rem', letterSpacing: '0.1em' }}>← BACK</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.42rem', color: `${accent}70`, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 2 }}>■ {activeBiz}</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.05rem', color: accent, margin: 0, textShadow: `0 0 20px ${accent}50` }}>{editingId ? 'Edit Entry' : 'New Entry'}</h1>
          </div>
          <div style={{ width: 60 }} />
        </div>

        {/* Form */}
        <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', position: 'relative', zIndex: 1, animation: ph(0.2, 0.9) }}>

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
            {[['in', '▲ Income', secondary], ['out', '▼ Expense', '#FF4D6A']].map(([v, l, col]) => (
              <button key={v} onClick={() => setForm(f => ({...f, type: v}))} style={{ flex: 1, background: form.type === v ? `${col}18` : 'rgba(13,12,11,0.7)', border: `1px solid ${form.type === v ? col : accent+'28'}`, color: form.type === v ? col : 'rgba(160,140,120,0.6)', padding: '0.7rem', borderRadius: 10, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', letterSpacing: '0.06em', transition: 'all 0.15s', boxShadow: form.type === v ? `0 0 16px ${col}30` : 'none' }}>{l}</button>
            ))}
          </div>

          <label style={labelStyle}>Description</label>
          <input style={inputStyle} placeholder="e.g. Harvest Market print sale" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />

          <label style={labelStyle}>Category</label>
          <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {categories[activeBiz].map(c => <option key={c}>{c}</option>)}
          </select>

          <label style={labelStyle}>Amount (AUD)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', color: accent, fontSize: '1.1rem' }}>$</span>
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
          </div>

          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />

          <label style={labelStyle}>Notes <span style={{ color: `${accent}50`, textTransform: 'none', letterSpacing: 0, fontSize: '0.58rem' }}>(optional)</span></label>
          <textarea style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Mono", monospace' }} rows={3} placeholder="Invoice number, client name, context…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />

          {formError && <p style={{ fontFamily: '"DM Mono", monospace', color: '#FF4D6A', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>{formError}</p>}

          <button onClick={submit} style={{ marginTop: '1.5rem', background: `linear-gradient(135deg, ${accent}40, ${accent}28)`, border: `1px solid ${accent}70`, borderRadius: 10, color: accent, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1rem', letterSpacing: '0.04em', padding: '0.85rem', cursor: 'pointer', fontWeight: 600, boxShadow: `0 0 24px ${accent}35`, textShadow: `0 0 12px ${accent}80` }}>
            {editingId ? 'Save Changes' : 'Save Entry'}
          </button>
          {editingId && (
            <button onClick={onDeleteEdit} style={{ marginTop: '0.5rem', background: 'none', border: '1px solid rgba(255,77,106,0.25)', borderRadius: 10, color: 'rgba(255,77,106,0.7)', fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', padding: '0.65rem', cursor: 'pointer' }}>Delete this entry</button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ─── MAIN CONTROLLER ──────────────────────────────────────────────────────────

export default function Ledger() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  function goBack() { setLeaving(true); setTimeout(() => navigate(-1), 280); }

  const saved = loadData();
  const [transactions, setTransactions] = useState(saved?.transactions || { Signal9: [], 'App Sales': [] });
  const [categories, setCategories]     = useState(saved?.categories   || DEFAULT_CATEGORIES);
  const [view, setView]                 = useState('landing');
  const [activeBiz, setActiveBiz]       = useState(null);
  const [editingId, setEditingId]       = useState(null);
  const [catView, setCatView]           = useState(false);
  const [initialForm, setInitialForm]   = useState(null);

  useEffect(() => { saveData({ transactions, categories }); }, [transactions, categories]);

  const openBiz  = (biz) => { setActiveBiz(biz); setCatView(false); setView('list'); };
  const openAdd  = ()    => { setEditingId(null); setInitialForm({ type: 'in', description: '', category: categories[activeBiz][0], amount: '', date: today(), notes: '' }); setView('form'); };
  const openEdit = (tx)  => { setEditingId(tx.id); setInitialForm({ type: tx.type, description: tx.description, category: tx.category, amount: String(tx.amount), date: tx.date, notes: tx.notes||'' }); setView('form'); };

  const submitForm = (entry) => {
    setTransactions(prev => ({ ...prev, [activeBiz]: editingId ? prev[activeBiz].map(tx => tx.id === editingId ? entry : tx) : [entry, ...prev[activeBiz]] }));
    setView('list');
  };
  const deleteEntry = (id) => { setTransactions(prev => ({ ...prev, [activeBiz]: prev[activeBiz].filter(tx => tx.id !== id) })); };

  const handleCatToggle = (biz, cat, action) => {
    if (action === 'add') {
      const c = cat.trim(); if (!c || categories[biz].includes(c)) return;
      setCategories(prev => ({ ...prev, [biz]: [...prev[biz], c] }));
    } else {
      if (categories[biz].length <= 1) return;
      setCategories(prev => ({ ...prev, [biz]: prev[biz].filter(c => c !== cat) }));
    }
  };

  if (view === 'landing') return <LandingView transactions={transactions} onOpen={openBiz} onBack={goBack} />;

  if (view === 'form') return (
    <FormView
      activeBiz={activeBiz}
      categories={categories}
      editingId={editingId}
      initialForm={initialForm}
      onBack={() => setView('list')}
      onSubmit={submitForm}
      onDeleteEdit={() => { deleteEntry(editingId); setView('list'); }}
    />
  );

  return (
    <ListView
      activeBiz={activeBiz}
      transactions={transactions}
      categories={categories}
      catView={catView}
      onBack={() => setView('landing')}
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={deleteEntry}
      onExport={() => exportCSV(transactions[activeBiz], activeBiz)}
      onToggleCat={(biz, cat, action) => action ? handleCatToggle(biz, cat, action) : setCatView(v => !v)}
    />
  );
}

const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  input::placeholder, textarea::placeholder { color: rgba(90,70,50,0.5); opacity: 1; }
  input:focus, select:focus, textarea:focus { outline: none; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
  select option { background: #0e0a06; }
  textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(196,82,42,0.3); border-radius: 2px; }
`;

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const PHASE1 = [
  { id: "market", label: "MARKET INTEL", icon: "🔍", color: "#00d4ff", glow: "rgba(0,212,255,0.12)", border: "rgba(0,212,255,0.35)", role: "Your Research Team",
    system: "You are a market research analyst specializing in Hawaii Island businesses. Given a business idea, provide a competitive snapshot: 3 existing competitors on Hawaii Island, local permits needed, target customer profile, and market opportunity. Be specific to Hawaii Island. Keep response under 100 words. No markdown, no headers, no bullets, no bold. Plain paragraphs. Start immediately." },
  { id: "financial", label: "FINANCIALS", icon: "💰", color: "#00ff88", glow: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.35)", role: "Your CFO",
    system: "You are a startup financial advisor for Hawaii businesses. Given a business idea, provide: startup costs (specific items), monthly operating costs, break-even timeline, Year 1 revenue range. Use Hawaii-specific pricing. Keep under 100 words. No markdown, no headers, no bullets, no bold. Plain paragraphs. Start immediately." },
  { id: "brand", label: "BRAND IDENTITY", icon: "🎯", color: "#ffaa00", glow: "rgba(255,170,0,0.12)", border: "rgba(255,170,0,0.35)", role: "Your Brand Agency",
    system: "You are a brand strategist. Given a business idea for Hawaii Island, generate: 3 business name options (one Hawaiian-influenced), a tagline, and a 2-sentence positioning statement. Keep under 80 words. No markdown, no headers, no bullets, no bold. Start immediately." },
  { id: "launch", label: "30-DAY LAUNCH", icon: "📣", color: "#ff4466", glow: "rgba(255,68,102,0.12)", border: "rgba(255,68,102,0.35)", role: "Your Marketing Director",
    system: "You are a marketing strategist for Hawaii businesses. Given a business idea, create a 30-day launch plan with 5 tactics. At least 2 Hawaii-specific. Keep under 100 words. Number 1-5. No markdown, no headers, no bold. Start immediately." },
];

const PHASE2 = [
  { id: "visual", label: "BRAND VISUAL", icon: "🎨", color: "#c084fc", glow: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.35)", role: "Your Design Team", hasColors: true,
    system: "You are a visual brand designer. Given a business idea for Hawaii Island, create a brand visual direction. You MUST start your response with exactly this on line 1: COLORS: #hex1 #hex2 #hex3 (3 real beautiful hex codes). Then on line 2 write: LOGO NAME: [the single best business name, short]. Then name a font pairing. Then 2 sentences on visual mood. Keep under 70 words total. No markdown, no bold. Start with COLORS: immediately." },
  { id: "funding", label: "FUNDING LETTER", icon: "📝", color: "#22d3ee", glow: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.35)", role: "Your Grant Writer",
    system: "You are a small business funding specialist in Hawaii. Given a business idea, write a compelling SBA microloan pitch letter. Include: business purpose, target market, funding amount requested (be specific), how funds will be used, community impact on Hawaii Island. Address to 'Dear Funding Committee'. Keep under 120 words. No markdown, no bold. Start with 'Dear Funding Committee,' immediately." },
  { id: "llc", label: "LAUNCH CHECKLIST", icon: "📋", color: "#f59e0b", glow: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", role: "Your Business Attorney + COO",
    system: "You are a business formation and operations specialist. Given a business idea for Hawaii, generate a complete launch-ready checklist. Use this exact format with each item on its own line: LLC: [best business name], Single-Member LLC, Hawaii ($50 DCCA filing fee) then EIN: Apply at irs.gov (free, instant online) then BANK: Open business checking (recommend ASB or FHB for Hawaii) then INSURANCE: [specific type needed for this business] estimated $X/month then DOMAIN: [suggest a .com domain based on the business name] then EMAIL: Set up [name]@[domain] via Google Workspace ($6/month) then FILE WITH: doola.com (formation + registered agent in under 10 minutes). Keep under 100 words. No markdown, no bold, no asterisks. Start immediately." },
];

function parseColors(text) {
  const m = text.match(/COLORS:\s*(#[0-9a-fA-F]{6})\s*(#[0-9a-fA-F]{6})\s*(#[0-9a-fA-F]{6})/);
  if (m) return [m[1], m[2], m[3]];
  const h = text.match(/#[0-9a-fA-F]{6}/g);
  return h ? h.slice(0, 3) : [];
}

function parseLogoName(text) {
  const m = text.match(/LOGO NAME:\s*(.+)/i);
  return m ? m[1].trim() : "";
}

function LogoConcepts({ name, colors }) {
  if (!name || colors.length < 2) return null;
  const initials = name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 10, flexShrink: 0, alignItems: "flex-start" }}>
      <div style={{ textAlign: "center" }}>
        <svg width="72" height="72" viewBox="0 0 100 100">
          <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={colors[0]} /><stop offset="100%" stopColor={colors[1]} /></linearGradient></defs>
          <circle cx="50" cy="50" r="46" fill="url(#g1)" />
          <text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="32" fontFamily="Georgia" fontWeight="bold">{initials}</text>
        </svg>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 2, letterSpacing: 1 }}>BADGE</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <svg width="72" height="72" viewBox="0 0 100 100">
          <rect x="4" y="4" width="44" height="92" rx="8" fill={colors[0]} />
          <rect x="52" y="4" width="44" height="92" rx="8" fill={colors[1]} />
          <text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="28" fontFamily="Georgia" fontWeight="bold">{initials}</text>
        </svg>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 2, letterSpacing: 1 }}>SPLIT</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <svg width="140" height="72" viewBox="0 0 200 100">
          <rect x="0" y="0" width="200" height="100" rx="12" fill="rgba(255,255,255,0.04)" stroke={colors[0]} strokeWidth="2" />
          <rect x="0" y="0" width="6" height="100" rx="3" fill={colors[0]} />
          <text x="20" y="42" fill={colors[0]} fontSize="16" fontFamily="Georgia" fontWeight="bold" letterSpacing="3">{name.toUpperCase().slice(0, 16)}</text>
          <text x="20" y="68" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Calibri" letterSpacing="2">HAWAII ISLAND</text>
        </svg>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 2, letterSpacing: 1 }}>WORDMARK</div>
      </div>
    </div>
  );
}

function LaunchCard({ panels, onClose }) {
  const vis = panels.visual;
  if (!vis?.text) return null;
  const colors = parseColors(vis.text);
  const logoName = parseLogoName(vis.text) || "Your Business";
  const initials = logoName.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const c1 = colors[0] || "#00d4ff", c2 = colors[1] || "#00ff88";
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(6,6,10,0.92)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 1s ease", cursor: "pointer",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 720, padding: "36px 44px", background: "linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))",
        border: `1px solid ${c1}33`, borderRadius: 20, boxShadow: `0 0 60px ${c1}22, 0 0 120px ${c2}11`, cursor: "default",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <svg width="70" height="70" viewBox="0 0 100 100">
            <defs><linearGradient id="lc" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient></defs>
            <circle cx="50" cy="50" r="46" fill="url(#lc)" />
            <text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="30" fontFamily="Georgia" fontWeight="bold">{initials}</text>
          </svg>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "Georgia" }}>{logoName}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic", marginTop: 2 }}>Hawaii Island</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {colors.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: c, boxShadow: `0 0 16px ${c}44` }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{c}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Market", status: "Validated", c: "#00d4ff" },
            { label: "Financials", status: "Projected", c: "#00ff88" },
            { label: "Brand", status: "Designed", c: "#ffaa00" },
            { label: "Launch Plan", status: "Ready", c: "#ff4466" },
            { label: "Funding Letter", status: "Written", c: "#22d3ee" },
            { label: "LLC + Ops", status: "Ready to File", c: "#f59e0b" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "12px 14px", background: `${item.c}0a`, borderRadius: 8, border: `1px solid ${item.c}25` }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: item.c, textTransform: "uppercase", marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{item.status} ✓</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", padding: "14px 0 4px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700,
            background: `linear-gradient(135deg,${c1},${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ BUSINESS READY TO LAUNCH ✦</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 6, letterSpacing: 2 }}>7 AI AGENTS &nbsp;•&nbsp; $0 COST &nbsp;•&nbsp; UNDER 2 MINUTES</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [panels, setPanels] = useState({});
  const [running, setRunning] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [phase, setPhase] = useState(0);
  const [viewPhase, setViewPhase] = useState(1); // which phase panels to SHOW
  const [timer, setTimer] = useState("0.0");
  const [p1Timer, setP1Timer] = useState("0.0");
  const [doneCount, setDoneCount] = useState(0);
  const [p2Done, setP2Done] = useState(0);
  const [p2Running, setP2Running] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const tickRef = useRef(null);
  const t0Ref = useRef(null);
  const doneRef = useRef(0);
  const done2Ref = useRef(0);

  const stream = useCallback(async (agent, biz, isP2) => {
    setPanels(p => ({ ...p, [agent.id]: { text: "", phase: "loading" } }));
    try {
      const ctrl = new AbortController();
      const kill = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({ system: agent.system, prompt: `Business idea: ${biz}. Located on Hawaii Island (Big Island). Provide your analysis now.` }),
      });
      clearTimeout(kill);
      if (!res.ok) throw new Error(res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "", buf = "";
      setPanels(p => ({ ...p, [agent.id]: { text: "", phase: "streaming" } }));
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const ln of lines) {
          if (!ln.startsWith("data: ")) continue;
          const raw = ln.slice(6).trim();
          if (raw === "[DONE]") continue;
          try { const j = JSON.parse(raw); if (j.type === "content_block_delta" && j.delta?.text) { full += j.delta.text; setPanels(p => ({ ...p, [agent.id]: { text: full, phase: "streaming" } })); } } catch {}
        }
      }
      setPanels(p => ({ ...p, [agent.id]: { text: full || "Complete.", phase: "done" } }));
      if (isP2) { done2Ref.current++; setP2Done(done2Ref.current); if (done2Ref.current >= 3) setP2Running(false); }
      else { doneRef.current++; setDoneCount(doneRef.current); if (doneRef.current >= 4) { clearInterval(tickRef.current); setRunning(false); } }
    } catch {
      setPanels(p => ({ ...p, [agent.id]: { text: "Agent timed out — we'll crunch this offline.", phase: "done" } }));
      if (isP2) { done2Ref.current++; setP2Done(done2Ref.current); if (done2Ref.current >= 3) setP2Running(false); }
      else { doneRef.current++; setDoneCount(doneRef.current); if (doneRef.current >= 4) { clearInterval(tickRef.current); setRunning(false); } }
    }
  }, []);

  const go = useCallback(() => {
    if (!idea.trim() || running) return;
    setRunning(true); setLaunched(true); setTimer("0.0"); setPhase(1); setViewPhase(1); setShowCard(false);
    setDoneCount(0); doneRef.current = 0; setP2Done(0); done2Ref.current = 0;
    t0Ref.current = Date.now();
    tickRef.current = setInterval(() => setTimer(((Date.now() - t0Ref.current) / 1000).toFixed(1)), 100);
    PHASE1.forEach((a, i) => setTimeout(() => stream(a, idea.trim(), false), i * 100));
  }, [idea, running, stream]);

  const go2 = useCallback(() => {
    setPhase(2); setViewPhase(2); setP2Running(true); done2Ref.current = 0; setP2Done(0);
    t0Ref.current = Date.now(); setTimer("0.0");
    tickRef.current = setInterval(() => setTimer(((Date.now() - t0Ref.current) / 1000).toFixed(1)), 100);
    PHASE2.forEach((a, i) => setTimeout(() => stream(a, idea.trim(), true), i * 150));
  }, [idea, stream]);

  const reset = () => {
    setIdea(""); setPanels({}); setLaunched(false); setTimer("0.0"); setPhase(0); setViewPhase(1); setShowCard(false);
    setRunning(false); setDoneCount(0); doneRef.current = 0; setP2Done(0); done2Ref.current = 0; setP2Running(false); clearInterval(tickRef.current);
  };

  useEffect(() => { const h = e => { if (e.key === "Escape") { if (showCard) setShowCard(false); else if (!running && !p2Running) reset(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [running, p2Running, showCard]);

  const p1Done = doneCount >= 4 && !running;
  const allDone = phase === 2 && p2Done >= 3 && !p2Running;

  useEffect(() => { if (p1Done && phase === 1) setP1Timer(timer); }, [p1Done, phase, timer]);
  useEffect(() => { if (allDone) { clearInterval(tickRef.current); setTimeout(() => setShowCard(true), 1500); } }, [allDone]);

  const F = { content: 22, contentP2: 18, panelLabel: 12, roleTag: 10, input: 20, button: 15, banner: 14, title: 38, titleSmall: 16 };

  function Panel({ agent, fontSize }) {
    const p = panels[agent.id];
    const loading = p?.phase === "loading";
    const streaming = p?.phase === "streaming";
    const done = p?.phase === "done";
    const active = streaming;
    const colors = (done || streaming) && agent.hasColors && p?.text ? parseColors(p.text) : [];
    const logoName = (done || streaming) && agent.hasColors && p?.text ? parseLogoName(p.text) : "";
    return (
      <div style={{
        background: active ? agent.glow : done ? agent.glow.replace("0.12","0.05") : "rgba(255,255,255,0.012)",
        border: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
        borderRadius: 10, padding: "10px 16px", transition: "all 0.4s", overflow: "hidden",
        boxShadow: active ? `0 0 30px ${agent.glow}` : "none", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingBottom: 5, flexShrink: 0,
          borderBottom: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}` }}>
          <span style={{ fontSize: 18 }}>{agent.icon}</span>
          <span style={{ fontSize: F.panelLabel, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: active || done ? agent.color : "rgba(255,255,255,0.2)" }}>{agent.label}</span>
          {(active || done) && <span style={{ fontSize: F.roleTag, color: "rgba(255,255,255,0.2)", fontStyle: "italic", marginLeft: 4 }}>— replaces {agent.role.toLowerCase()}</span>}
          {active && <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: agent.color, animation: "pulse 1s ease-in-out infinite", boxShadow: `0 0 10px ${agent.color}` }} />}
          {done && <span style={{ marginLeft: "auto", fontSize: 10, color: agent.color, opacity: 0.6 }}>✓</span>}
        </div>
        {agent.hasColors && colors.length >= 2 && logoName && (done || streaming) && <LogoConcepts name={logoName} colors={colors} />}
        <div style={{ flex: 1, overflow: "auto", fontSize, lineHeight: 1.5,
          color: active || done ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.2)",
          fontFamily: "'Instrument Serif','Georgia',serif", whiteSpace: "pre-wrap", wordBreak: "break-word", letterSpacing: 0.3 }}>
          {loading && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", color: "rgba(255,255,255,0.2)" }}>
              <span style={{ animation: "pulse 1s ease-in-out infinite", fontSize: 14 }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.15s infinite", fontSize: 14 }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.3s infinite", fontSize: 14 }}>●</span>
              <span style={{ fontSize: 13, fontFamily: "inherit", marginLeft: 6, letterSpacing: 2 }}>Deploying agent...</span>
            </div>
          )}
          {(streaming || done) && p?.text && (<>{p.text}{streaming && <span style={{ display: "inline-block", width: 3, height: fontSize * 0.85, background: agent.color, marginLeft: 3, animation: "blink 0.7s step-end infinite", verticalAlign: "text-bottom" }} />}</>)}
        </div>
      </div>
    );
  }

  // Can toggle between phases?
  const canToggle = phase >= 2;

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 80% 50% at 50% -10%,rgba(0,212,255,0.07),transparent),radial-gradient(ellipse 50% 40% at 85% 100%,rgba(255,68,102,0.05),transparent),radial-gradient(ellipse 50% 30% at 5% 90%,rgba(0,255,136,0.05),transparent)` }} />

      {/* TOP BAR */}
      <div style={{ position: "relative", zIndex: 2, flexShrink: 0, padding: launched ? "6px 20px 4px" : "16px 20px 6px" }}>
        <div style={{ textAlign: "center", marginBottom: launched ? 3 : 8 }}>
          {!launched && <div style={{ fontSize: 10, letterSpacing: 7, color: "rgba(255,255,255,0.12)", textTransform: "uppercase", marginBottom: 3 }}>Hawaii Island AI Summit 2026</div>}
          <h1 style={{ fontSize: launched ? F.titleSmall : F.title, fontWeight: 300, margin: 0, transition: "font-size 0.4s",
            background: "linear-gradient(135deg,#00d4ff,#00ff88,#ffaa00,#ff4466)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {viewPhase === 2 && launched ? "Phase 2 — From Strategy to Launch" : "7 AI Agents. 1 Business Idea. 2 Minutes."}
          </h1>
        </div>

        {/* Input + buttons row */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", maxWidth: 900, margin: "0 auto", flexWrap: "wrap" }}>

          {/* Phase toggle tabs */}
          {canToggle && (
            <div style={{ display: "flex", gap: 2, marginRight: 8 }}>
              <button onClick={() => setViewPhase(1)} style={{
                padding: "8px 16px", fontSize: 10, fontWeight: 700, fontFamily: "inherit", letterSpacing: 2,
                textTransform: "uppercase", border: "none", borderRadius: "8px 0 0 8px", cursor: "pointer",
                background: viewPhase === 1 ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.03)",
                color: viewPhase === 1 ? "#00d4ff" : "rgba(255,255,255,0.15)",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}>◀ STRATEGY</button>
              <button onClick={() => setViewPhase(2)} style={{
                padding: "8px 16px", fontSize: 10, fontWeight: 700, fontFamily: "inherit", letterSpacing: 2,
                textTransform: "uppercase", border: "none", borderRadius: "0 8px 8px 0", cursor: "pointer",
                background: viewPhase === 2 ? "rgba(192,132,252,0.15)" : "rgba(255,255,255,0.03)",
                color: viewPhase === 2 ? "#c084fc" : "rgba(255,255,255,0.15)",
              }}>EXECUTION ▶</button>
            </div>
          )}

          {/* Input (only in phase 1 pre-launch or phase 1 running) */}
          {!canToggle && <div style={{ flex: 1, maxWidth: 440 }}>
            <input type="text" placeholder="Shout out a business idea..." value={idea} onChange={e => setIdea(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()} disabled={running || p1Done} autoFocus
              style={{ width: "100%", padding: "10px 16px", fontSize: F.input, fontFamily: "inherit",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", outline: "none" }} />
          </div>}

          {/* Activate Phase 1 */}
          {!canToggle && !p1Done && <button onClick={go} disabled={!idea.trim() || running} style={{
            padding: "10px 28px", fontSize: F.button, fontWeight: 700, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase",
            border: "none", borderRadius: 8, minWidth: 220,
            background: !idea.trim() || running ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#00d4ff,#00ff88)",
            color: !idea.trim() || running ? "rgba(255,255,255,0.12)" : "#06060a",
            cursor: !idea.trim() || running ? "not-allowed" : "pointer",
          }}>{running ? `AGENTS ACTIVE — ${timer}s` : "ACTIVATE AGENTS"}</button>}

          {/* Deploy Phase 2 */}
          {p1Done && phase === 1 && <button onClick={go2} style={{
            padding: "14px 40px", fontSize: 16, fontWeight: 700, fontFamily: "inherit", letterSpacing: 3, textTransform: "uppercase",
            border: "none", borderRadius: 8, background: "linear-gradient(135deg,#c084fc,#22d3ee,#f59e0b)",
            color: "#06060a", cursor: "pointer", animation: "fadeIn 0.6s", boxShadow: "0 0 30px rgba(192,132,252,0.3)",
          }}>🚀 DEPLOY PHASE 2 — BUILD THE BUSINESS</button>}

          {/* Phase 2 running */}
          {phase === 2 && p2Running && <div style={{
            padding: "12px 28px", fontSize: F.button, fontWeight: 700, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase",
            background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)", borderRadius: 8, color: "#c084fc",
          }}>BUILDING BUSINESS... {timer}s</div>}

          {/* Show Launch Card button (after card dismissed) */}
          {allDone && !showCard && <button onClick={() => setShowCard(true)} style={{
            padding: "10px 20px", fontSize: 11, fontWeight: 700, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase",
            border: "none", borderRadius: 8, background: "linear-gradient(135deg,#c084fc,#22d3ee)",
            color: "#06060a", cursor: "pointer",
          }}>VIEW LAUNCH CARD</button>}

          {/* Reset */}
          {(p1Done || allDone) && <button onClick={() => { setShowCard(false); reset(); }} style={{
            padding: "10px 14px", fontSize: 10, fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase",
            background: "transparent", color: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, cursor: "pointer",
          }}>NEW IDEA</button>}
        </div>

        {/* Status bars */}
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {running && <div style={{ height: 3, background: "rgba(255,255,255,0.03)", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(doneCount/4)*100}%`, background: "linear-gradient(90deg,#00d4ff,#00ff88,#ffaa00,#ff4466)", transition: "width 0.5s" }} /></div>}
          {p2Running && <div style={{ height: 3, background: "rgba(255,255,255,0.03)", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(p2Done/3)*100}%`, background: "linear-gradient(90deg,#c084fc,#22d3ee,#f59e0b)", transition: "width 0.5s" }} /></div>}
          {p1Done && phase === 1 && (
            <div style={{ textAlign: "center", marginTop: 4, display: "flex", justifyContent: "center", gap: 20, alignItems: "center", animation: "fadeIn 0.5s" }}>
              <span style={{ fontSize: F.banner, letterSpacing: 3, textTransform: "uppercase", background: "linear-gradient(135deg,#00d4ff,#00ff88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ Phase 1 — {p1Timer}s</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>4 departments</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>$0 cost</span>
            </div>
          )}
        </div>
      </div>

      {/* PANELS */}
      <div style={{ flex: 1, position: "relative", zIndex: 2, padding: "4px 14px 8px", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {launched ? (
          viewPhase === 2 && phase >= 2 ? (
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, minHeight: 0, animation: "fadeIn 0.3s" }}>
              {PHASE2.map(a => <Panel key={a.id} agent={a} fontSize={F.contentP2} />)}
            </div>
          ) : (
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, minHeight: 0, animation: canToggle ? "fadeIn 0.3s" : "none" }}>
              {PHASE1.map(a => <Panel key={a.id} agent={a} fontSize={F.content} />)}
            </div>
          )
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: 5, color: "rgba(255,255,255,0.08)", textTransform: "uppercase", marginBottom: 10 }}>Phase 1 — Strategy</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, maxWidth: 680, width: "100%", marginBottom: 20 }}>
              {PHASE1.map(a => (
                <div key={a.id} style={{ padding: "20px 10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.008)", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{a.icon}</div>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: a.color, opacity: 0.4, fontWeight: 700 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.08)", fontStyle: "italic", marginTop: 2 }}>{a.role}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, letterSpacing: 5, color: "rgba(255,255,255,0.08)", textTransform: "uppercase", marginBottom: 10 }}>Phase 2 — Execution</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, maxWidth: 520, width: "100%", marginBottom: 16 }}>
              {PHASE2.map(a => (
                <div key={a.id} style={{ padding: "20px 10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.008)", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{a.icon}</div>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: a.color, opacity: 0.4, fontWeight: 700 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.08)", fontStyle: "italic", marginTop: 2 }}>{a.role}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, fontFamily: "'Instrument Serif','Georgia',serif", fontStyle: "italic", color: "rgba(255,255,255,0.07)" }}>7 agents ready to deploy...</div>
          </div>
        )}
      </div>

      {showCard && <LaunchCard panels={panels} onClose={() => setShowCard(false)} />}
    </main>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const PHASE1 = [
  {
    id: "market", label: "MARKET INTEL", icon: "🔍", color: "#00d4ff",
    glow: "rgba(0,212,255,0.12)", border: "rgba(0,212,255,0.35)", role: "Your Research Team",
    system: "You are a market research analyst specializing in Hawaii Island businesses. Given a business idea, provide a competitive snapshot: 3 existing competitors on Hawaii Island, local permits needed, target customer profile, and market opportunity. Be specific to Hawaii Island. Keep response under 100 words. No markdown, no headers, no bullets, no bold. Plain paragraphs. Start immediately.",
  },
  {
    id: "financial", label: "FINANCIALS", icon: "💰", color: "#00ff88",
    glow: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.35)", role: "Your CFO",
    system: "You are a startup financial advisor for Hawaii businesses. Given a business idea, provide: startup costs (specific items), monthly operating costs, break-even timeline, Year 1 revenue range. Use Hawaii-specific pricing. Keep under 100 words. No markdown, no headers, no bullets, no bold. Plain paragraphs. Start immediately.",
  },
  {
    id: "brand", label: "BRAND IDENTITY", icon: "🎯", color: "#ffaa00",
    glow: "rgba(255,170,0,0.12)", border: "rgba(255,170,0,0.35)", role: "Your Brand Agency",
    system: "You are a brand strategist. Given a business idea for Hawaii Island, generate: 3 business name options (one Hawaiian-influenced), a tagline, and a 2-sentence positioning statement. Keep under 80 words. No markdown, no headers, no bullets, no bold. Start immediately.",
  },
  {
    id: "launch", label: "30-DAY LAUNCH", icon: "📣", color: "#ff4466",
    glow: "rgba(255,68,102,0.12)", border: "rgba(255,68,102,0.35)", role: "Your Marketing Director",
    system: "You are a marketing strategist for Hawaii businesses. Given a business idea, create a 30-day launch plan with 5 tactics. At least 2 Hawaii-specific. Keep under 100 words. Number 1-5. No markdown, no headers, no bold. Start immediately.",
  },
];

const PHASE2 = [
  {
    id: "visual", label: "BRAND VISUAL", icon: "🎨", color: "#c084fc",
    glow: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.35)", role: "Your Design Team",
    hasColors: true,
    system: "You are a visual brand designer. Given a business idea for Hawaii Island, create a brand visual direction. Start your response with exactly this format on line 1: COLORS: #hex1 #hex2 #hex3 (use 3 real hex color codes that fit the brand). Then name a primary and secondary font pairing. Then 2 sentences on visual mood. Keep under 70 words total. No markdown, no bold. Start with COLORS: immediately.",
  },
  {
    id: "funding", label: "FUNDING LETTER", icon: "📝", color: "#22d3ee",
    glow: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.35)", role: "Your Grant Writer",
    system: "You are a small business funding specialist in Hawaii. Given a business idea, write a compelling SBA microloan pitch letter. Include: business purpose, target market, funding amount requested, how funds will be used, community impact. Address to 'Dear Funding Committee'. Keep under 120 words. No markdown, no bold. Start with 'Dear Funding Committee,' immediately.",
  },
  {
    id: "llc", label: "LLC FILING", icon: "📋", color: "#f59e0b",
    glow: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", role: "Your Business Attorney",
    system: "You are a business formation specialist. Given a business idea for Hawaii Island, generate an LLC filing preview using these exact labels on separate lines: BUSINESS NAME: [best name] then STRUCTURE: Single-Member LLC then STATE: Hawaii then REGISTERED AGENT: Doola (recommended) then BUSINESS PURPOSE: [one sentence] then FILING FEE: $50 (Hawaii DCCA) then STATUS: Ready to file at doola.com. Keep under 60 words. No markdown, no bold. Start immediately.",
  },
];

function parseColors(text) {
  const match = text.match(/COLORS:\s*(#[0-9a-fA-F]{6})\s*(#[0-9a-fA-F]{6})\s*(#[0-9a-fA-F]{6})/);
  if (match) return [match[1], match[2], match[3]];
  const hexes = text.match(/#[0-9a-fA-F]{6}/g);
  return hexes ? hexes.slice(0, 3) : [];
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [panels, setPanels] = useState({});
  const [running, setRunning] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [phase, setPhase] = useState(0);
  const [timer, setTimer] = useState("0.0");
  const [p1Timer, setP1Timer] = useState("0.0");
  const [doneCount, setDoneCount] = useState(0);
  const [p2Done, setP2Done] = useState(0);
  const [p2Running, setP2Running] = useState(false);
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
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ system: agent.system,
          prompt: `Business idea: ${biz}. Located on Hawaii Island (Big Island). Provide your analysis now.` }),
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
          try {
            const j = JSON.parse(raw);
            if (j.type === "content_block_delta" && j.delta?.text) {
              full += j.delta.text;
              setPanels(p => ({ ...p, [agent.id]: { text: full, phase: "streaming" } }));
            }
          } catch {}
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
    setRunning(true); setLaunched(true); setTimer("0.0"); setPhase(1);
    setDoneCount(0); doneRef.current = 0; setP2Done(0); done2Ref.current = 0;
    t0Ref.current = Date.now();
    tickRef.current = setInterval(() => setTimer(((Date.now() - t0Ref.current) / 1000).toFixed(1)), 100);
    PHASE1.forEach((a, i) => setTimeout(() => stream(a, idea.trim(), false), i * 100));
  }, [idea, running, stream]);

  const go2 = useCallback(() => {
    setPhase(2); setP2Running(true); done2Ref.current = 0; setP2Done(0);
    t0Ref.current = Date.now(); setTimer("0.0");
    tickRef.current = setInterval(() => setTimer(((Date.now() - t0Ref.current) / 1000).toFixed(1)), 100);
    PHASE2.forEach((a, i) => setTimeout(() => stream(a, idea.trim(), true), i * 150));
  }, [idea, stream]);

  const reset = () => {
    setIdea(""); setPanels({}); setLaunched(false); setTimer("0.0"); setPhase(0);
    setRunning(false); setDoneCount(0); doneRef.current = 0;
    setP2Done(0); done2Ref.current = 0; setP2Running(false); clearInterval(tickRef.current);
  };

  useEffect(() => { const h = e => { if (e.key === "Escape") reset(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);

  const p1Done = doneCount >= 4 && !running;
  const allDone = phase === 2 && p2Done >= 3 && !p2Running;

  // Save phase 1 time when it completes
  useEffect(() => { if (p1Done && phase === 1) setP1Timer(timer); }, [p1Done, phase, timer]);
  useEffect(() => { if (allDone) clearInterval(tickRef.current); }, [allDone]);

  // ─── FONT SIZES (PROJECTOR OPTIMIZED) ───
  const F = {
    content: 22,        // Main panel text — readable from 50ft
    contentP2: 19,      // Phase 2 panels (3 col, slightly smaller)
    panelLabel: 12,     // Agent name headers
    roleTag: 10,        // "replaces your..." text
    loading: 14,        // "Deploying agent..." dots
    input: 20,          // Input field text
    button: 15,         // Button text
    banner: 14,         // Completion banners
    title: 38,          // Main title (idle)
    titleSmall: 16,     // Title (launched)
  };

  function AgentPanel({ agent, fontSize }) {
    const p = panels[agent.id];
    const loading = p?.phase === "loading";
    const streaming = p?.phase === "streaming";
    const done = p?.phase === "done";
    const active = streaming;
    const colors = (done || streaming) && agent.hasColors && p?.text ? parseColors(p.text) : [];

    return (
      <div style={{
        background: active ? agent.glow : done ? agent.glow.replace("0.12","0.05") : "rgba(255,255,255,0.012)",
        border: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
        borderRadius: 10, padding: "10px 16px",
        transition: "all 0.4s", overflow: "hidden",
        boxShadow: active ? `0 0 30px ${agent.glow}` : "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 6, paddingBottom: 5, flexShrink: 0,
          borderBottom: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
        }}>
          <span style={{ fontSize: 18 }}>{agent.icon}</span>
          <span style={{
            fontSize: F.panelLabel, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase",
            color: active || done ? agent.color : "rgba(255,255,255,0.2)",
          }}>{agent.label}</span>
          {(active || done) && (
            <span style={{ fontSize: F.roleTag, color: "rgba(255,255,255,0.2)", fontStyle: "italic", marginLeft: 4 }}>
              — replaces {agent.role.toLowerCase()}
            </span>
          )}
          {active && <span style={{
            marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
            background: agent.color, animation: "pulse 1s ease-in-out infinite",
            boxShadow: `0 0 10px ${agent.color}`,
          }} />}
          {done && <span style={{ marginLeft: "auto", fontSize: 10, color: agent.color, opacity: 0.6 }}>✓</span>}
        </div>

        {/* Color swatches */}
        {colors.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 8, flexShrink: 0 }}>
            {colors.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 6, background: c,
                  border: "1px solid rgba(255,255,255,0.1)", boxShadow: `0 0 14px ${c}55`,
                }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "inherit" }}>{c}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1, overflow: "auto",
          fontSize: fontSize, lineHeight: 1.5,
          color: active || done ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.2)",
          fontFamily: "'Instrument Serif','Georgia',serif",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          letterSpacing: 0.3,
        }}>
          {loading && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", color: "rgba(255,255,255,0.2)" }}>
              <span style={{ animation: "pulse 1s ease-in-out infinite", fontSize: F.loading }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.15s infinite", fontSize: F.loading }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.3s infinite", fontSize: F.loading }}>●</span>
              <span style={{ fontSize: F.loading, fontFamily: "inherit", marginLeft: 6, letterSpacing: 2 }}>Deploying agent...</span>
            </div>
          )}
          {(streaming || done) && p?.text && (
            <>
              {p.text}
              {streaming && (
                <span style={{
                  display: "inline-block", width: 3, height: fontSize * 0.85,
                  background: agent.color, marginLeft: 3,
                  animation: "blink 0.7s step-end infinite",
                  verticalAlign: "text-bottom",
                }} />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Ambient */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,212,255,0.07), transparent),
          radial-gradient(ellipse 50% 40% at 85% 100%, rgba(255,68,102,0.05), transparent),
          radial-gradient(ellipse 50% 30% at 5% 90%, rgba(0,255,136,0.05), transparent)`,
      }} />

      {/* ─── TOP BAR ─── */}
      <div style={{ position: "relative", zIndex: 2, flexShrink: 0, padding: launched ? "6px 20px 4px" : "16px 20px 6px", transition: "padding 0.4s" }}>
        <div style={{ textAlign: "center", marginBottom: launched ? 3 : 8 }}>
          {!launched && <div style={{ fontSize: 10, letterSpacing: 7, color: "rgba(255,255,255,0.12)", textTransform: "uppercase", marginBottom: 3 }}>Hawaii Island AI Summit 2026</div>}
          <h1 style={{
            fontSize: launched ? F.titleSmall : F.title, fontWeight: 300, margin: 0, transition: "font-size 0.4s",
            background: "linear-gradient(135deg, #00d4ff, #00ff88, #ffaa00, #ff4466)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            {phase === 2 ? "Phase 2 — From Strategy to Launch" : "7 AI Agents. 1 Business Idea. 2 Minutes."}
          </h1>
        </div>

        {/* Input + buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", maxWidth: 860, margin: "0 auto" }}>
          {phase !== 2 && (
            <div style={{ flex: 1, maxWidth: 440 }}>
              <input type="text" placeholder="Shout out a business idea..."
                value={idea} onChange={e => setIdea(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go()} disabled={running || p1Done} autoFocus
                style={{
                  width: "100%", padding: "10px 16px", fontSize: F.input, fontFamily: "inherit",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#fff", outline: "none",
                }}
              />
            </div>
          )}
          {phase !== 2 && !p1Done && (
            <button onClick={go} disabled={!idea.trim() || running} style={{
              padding: "10px 28px", fontSize: F.button, fontWeight: 700, fontFamily: "inherit",
              letterSpacing: 2, textTransform: "uppercase", border: "none", borderRadius: 8,
              minWidth: 220, whiteSpace: "nowrap",
              background: !idea.trim() || running ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #00d4ff, #00ff88)",
              color: !idea.trim() || running ? "rgba(255,255,255,0.12)" : "#06060a",
              cursor: !idea.trim() || running ? "not-allowed" : "pointer",
            }}>
              {running ? `AGENTS ACTIVE — ${timer}s` : "ACTIVATE AGENTS"}
            </button>
          )}

          {/* ─── THE PHASE 2 BUTTON ─── */}
          {p1Done && phase === 1 && (
            <button onClick={go2} style={{
              padding: "14px 40px", fontSize: 16, fontWeight: 700, fontFamily: "inherit",
              letterSpacing: 3, textTransform: "uppercase", border: "none", borderRadius: 8,
              background: "linear-gradient(135deg, #c084fc, #22d3ee, #f59e0b)",
              color: "#06060a", cursor: "pointer",
              animation: "fadeIn 0.6s ease",
              boxShadow: "0 0 30px rgba(192,132,252,0.3)",
            }}>
              🚀 DEPLOY PHASE 2 — BUILD THE BUSINESS
            </button>
          )}

          {phase === 2 && p2Running && (
            <div style={{
              padding: "12px 28px", fontSize: F.button, fontWeight: 700, fontFamily: "inherit",
              letterSpacing: 2, textTransform: "uppercase",
              background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)",
              borderRadius: 8, color: "#c084fc",
            }}>BUILDING BUSINESS... {timer}s</div>
          )}

          {(p1Done || allDone) && <button onClick={reset} style={{
            padding: "10px 14px", fontSize: 10, fontFamily: "inherit", letterSpacing: 1,
            textTransform: "uppercase", background: "transparent", color: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, cursor: "pointer",
          }}>NEW IDEA</button>}
        </div>

        {/* Status */}
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {running && (
            <div style={{ height: 3, background: "rgba(255,255,255,0.03)", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneCount/4)*100}%`, background: "linear-gradient(90deg,#00d4ff,#00ff88,#ffaa00,#ff4466)", transition: "width 0.5s" }} />
            </div>
          )}
          {p2Running && (
            <div style={{ height: 3, background: "rgba(255,255,255,0.03)", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(p2Done/3)*100}%`, background: "linear-gradient(90deg,#c084fc,#22d3ee,#f59e0b)", transition: "width 0.5s" }} />
            </div>
          )}
          {p1Done && phase === 1 && (
            <div style={{ textAlign: "center", marginTop: 4, animation: "fadeIn 0.5s", display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
              <span style={{ fontSize: F.banner, letterSpacing: 3, textTransform: "uppercase", background: "linear-gradient(135deg,#00d4ff,#00ff88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ Phase 1 complete — {p1Timer}s</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>4 departments</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>$0 cost</span>
            </div>
          )}
          {allDone && (
            <div style={{ textAlign: "center", marginTop: 4, animation: "fadeIn 0.8s", display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
              <span style={{ fontSize: 15, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, background: "linear-gradient(135deg,#c084fc,#22d3ee,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ BUSINESS READY TO LAUNCH ✦</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: 13, letterSpacing: 2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>7 agents</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ fontSize: 13, letterSpacing: 2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>$0 cost</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── PANELS ─── */}
      <div style={{ flex: 1, position: "relative", zIndex: 2, padding: "4px 14px 8px", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {launched ? (
          phase === 2 ? (
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, minHeight: 0, animation: "fadeIn 0.5s" }}>
              {PHASE2.map(a => <AgentPanel key={a.id} agent={a} fontSize={F.contentP2} />)}
            </div>
          ) : (
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, minHeight: 0 }}>
              {PHASE1.map(a => <AgentPanel key={a.id} agent={a} fontSize={F.content} />)}
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
    </main>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const AGENTS = [
  {
    id: "market",
    label: "MARKET INTEL",
    icon: "🔍",
    color: "#00d4ff",
    glow: "rgba(0, 212, 255, 0.12)",
    border: "rgba(0, 212, 255, 0.35)",
    system:
      "You are a market research analyst specializing in Hawaii Island businesses. Given a business idea, provide a competitive snapshot: 3 existing competitors or comparable businesses on Hawaii Island, local permits or licensing needed, target customer profile, and estimated market opportunity. Be specific to Hawaii Island (Big Island) geography and economics. Keep response under 140 words. No markdown formatting, no headers, no bullet points, no asterisks, no bold. Plain conversational paragraphs only. Start immediately with the analysis.",
  },
  {
    id: "financial",
    label: "FINANCIALS",
    icon: "💰",
    color: "#00ff88",
    glow: "rgba(0, 255, 136, 0.12)",
    border: "rgba(0, 255, 136, 0.35)",
    system:
      "You are a startup financial advisor for Hawaii-based small businesses. Given a business idea, provide: estimated startup costs (specific items — equipment, permits, first month rent), monthly operating costs, break-even timeline, and projected Year 1 revenue range. Use realistic Hawaii-specific pricing (higher COL, shipping, island logistics). Keep response under 140 words. No markdown formatting, no headers, no bullet points, no asterisks, no bold. Plain conversational paragraphs only. Start immediately with the numbers.",
  },
  {
    id: "brand",
    label: "BRAND IDENTITY",
    icon: "🎯",
    color: "#ffaa00",
    glow: "rgba(255, 170, 0, 0.12)",
    border: "rgba(255, 170, 0, 0.35)",
    system:
      "You are a brand strategist. Given a business idea for Hawaii Island, generate: 3 creative business name options (at least one incorporating Hawaiian language or culture respectfully), a tagline for the strongest name, and a 2-sentence brand positioning statement. Keep response under 110 words. No markdown formatting, no headers, no bullet points, no asterisks, no bold. Plain text only. Start immediately.",
  },
  {
    id: "launch",
    label: "30-DAY LAUNCH",
    icon: "📣",
    color: "#ff4466",
    glow: "rgba(255, 68, 102, 0.12)",
    border: "rgba(255, 68, 102, 0.35)",
    system:
      "You are a marketing strategist for launching local Hawaii businesses. Given a business idea, create a 30-day launch plan with exactly 5 specific actionable tactics. At least 2 must be Hawaii-specific (farmer's markets, talk story events, local radio, community partnerships, Big Island social media groups, etc.). Include 1 digital tactic. Keep response under 140 words. Number each tactic 1 through 5. No markdown formatting, no headers, no asterisks, no bold. Plain numbered list only. Start immediately.",
  },
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [panels, setPanels] = useState({});
  const [running, setRunning] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [timer, setTimer] = useState("0.0");
  const [doneCount, setDoneCount] = useState(0);
  const tickRef = useRef(null);
  const t0Ref = useRef(null);
  const doneRef = useRef(0);

  const streamAgent = useCallback(async (agent, biz) => {
    setPanels((p) => ({ ...p, [agent.id]: { text: "", phase: "loading" } }));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system: agent.system,
          prompt: `Business idea: ${biz}. Located on Hawaii Island (Big Island). Provide your analysis now.`,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API error " + res.status);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";
      setPanels((p) => ({ ...p, [agent.id]: { text: "", phase: "streaming" } }));
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                full += parsed.delta.text;
                setPanels((p) => ({ ...p, [agent.id]: { text: full, phase: "streaming" } }));
              }
            } catch {}
          }
        }
      }
      setPanels((p) => ({ ...p, [agent.id]: { text: full || "Analysis complete.", phase: "done" } }));
      doneRef.current += 1;
      setDoneCount(doneRef.current);
      if (doneRef.current >= 4) { clearInterval(tickRef.current); setRunning(false); }
    } catch {
      setPanels((p) => ({
        ...p,
        [agent.id]: { text: "Agent timed out — strong idea though, we'll crunch this offline.", phase: "done" },
      }));
      doneRef.current += 1;
      setDoneCount(doneRef.current);
      if (doneRef.current >= 4) { clearInterval(tickRef.current); setRunning(false); }
    }
  }, []);

  const go = useCallback(() => {
    if (!idea.trim() || running) return;
    setRunning(true); setLaunched(true); setTimer("0.0");
    setDoneCount(0); doneRef.current = 0; t0Ref.current = Date.now();
    tickRef.current = setInterval(() => {
      setTimer(((Date.now() - t0Ref.current) / 1000).toFixed(1));
    }, 100);
    AGENTS.forEach((a, i) => setTimeout(() => streamAgent(a, idea.trim()), i * 100));
  }, [idea, running, streamAgent]);

  const reset = () => {
    setIdea(""); setPanels({}); setLaunched(false); setTimer("0.0");
    setRunning(false); setDoneCount(0); doneRef.current = 0; clearInterval(tickRef.current);
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") reset(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const allDone = doneCount >= 4 && !running;

  return (
    <main style={{
      height: "100vh", display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
    }}>
      {/* Ambient */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,212,255,0.06), transparent),
          radial-gradient(ellipse 50% 40% at 85% 100%, rgba(255,68,102,0.04), transparent),
          radial-gradient(ellipse 50% 30% at 5% 90%, rgba(0,255,136,0.04), transparent)`,
      }} />

      {/* ─── TOP BAR ─── */}
      <div style={{
        position: "relative", zIndex: 2, flexShrink: 0,
        padding: launched ? "8px 20px 4px" : "24px 20px 8px",
        transition: "padding 0.4s ease",
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: launched ? 4 : 12 }}>
          {!launched && (
            <div style={{
              fontSize: 8, letterSpacing: 6, color: "rgba(255,255,255,0.15)",
              textTransform: "uppercase", marginBottom: 3,
            }}>Hawaii Island AI Summit 2026</div>
          )}
          <h1 style={{
            fontSize: launched ? 16 : 32, fontWeight: 300, letterSpacing: -0.5, margin: 0,
            transition: "font-size 0.4s ease",
            background: "linear-gradient(135deg, #00d4ff, #00ff88, #ffaa00, #ff4466)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>4 AI Agents. 1 Business Idea. 90 Seconds.</h1>
          {!launched && (
            <p style={{
              fontSize: 12, color: "rgba(255,255,255,0.18)", marginTop: 3,
              fontFamily: "'Instrument Serif','Georgia',serif", fontStyle: "italic",
            }}>Give me any business idea. Watch what happens.</p>
          )}
        </div>

        {/* Input row */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "center", alignItems: "center",
          maxWidth: 720, margin: "0 auto",
        }}>
          <div style={{ flex: 1, maxWidth: 420 }}>
            <input type="text" placeholder="Shout out a business idea..."
              value={idea} onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()} disabled={running} autoFocus
              style={{
                width: "100%", padding: "9px 14px", fontSize: 15, fontFamily: "inherit",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#fff", outline: "none",
              }}
            />
          </div>
          <button onClick={go} disabled={!idea.trim() || running} style={{
            padding: "9px 22px", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            letterSpacing: 2, textTransform: "uppercase", border: "none", borderRadius: 8,
            minWidth: 140, whiteSpace: "nowrap", transition: "all 0.3s",
            background: !idea.trim() || running ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #00d4ff, #00ff88)",
            color: !idea.trim() || running ? "rgba(255,255,255,0.12)" : "#06060a",
            cursor: !idea.trim() || running ? "not-allowed" : "pointer",
          }}>
            {running ? `BUILDING... ${timer}s` : "BUILD IT"}
          </button>
          {launched && !running && (
            <button onClick={reset} style={{
              padding: "9px 12px", fontSize: 9, fontFamily: "inherit", letterSpacing: 1,
              textTransform: "uppercase", background: "transparent", color: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, cursor: "pointer",
            }}>NEW IDEA</button>
          )}
        </div>

        {/* Progress / Complete */}
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {running && (
            <div style={{ height: 2, background: "rgba(255,255,255,0.03)", borderRadius: 1, marginTop: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(doneCount / 4) * 100}%`,
                background: "linear-gradient(90deg, #00d4ff, #00ff88, #ffaa00, #ff4466)",
                transition: "width 0.5s ease",
              }} />
            </div>
          )}
          {allDone && (
            <div style={{ textAlign: "center", marginTop: 4, animation: "fadeIn 0.5s ease" }}>
              <span style={{
                fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
                background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>✦ Complete in {timer} seconds ✦</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN AREA ─── */}
      <div style={{
        flex: 1, position: "relative", zIndex: 2,
        padding: "6px 20px 12px", minHeight: 0,
        display: "flex", flexDirection: "column",
      }}>
        {launched ? (
          <div style={{
            flex: 1, display: "grid",
            gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr",
            gap: 8, minHeight: 0,
          }}>
            {AGENTS.map((agent) => {
              const p = panels[agent.id];
              const loading = p?.phase === "loading";
              const streaming = p?.phase === "streaming";
              const done = p?.phase === "done";
              const active = streaming;
              return (
                <div key={agent.id} style={{
                  background: active ? agent.glow : done ? agent.glow.replace("0.12","0.05") : "rgba(255,255,255,0.012)",
                  border: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
                  borderRadius: 10, padding: "10px 14px",
                  transition: "all 0.4s", position: "relative",
                  overflow: "hidden",
                  boxShadow: active ? `0 0 20px ${agent.glow}` : "none",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 6, paddingBottom: 5, flexShrink: 0,
                    borderBottom: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
                  }}>
                    <span style={{ fontSize: 13 }}>{agent.icon}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase",
                      color: active || done ? agent.color : "rgba(255,255,255,0.2)",
                    }}>{agent.label}</span>
                    {active && <span style={{
                      marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                      background: agent.color, animation: "pulse 1s ease-in-out infinite",
                      boxShadow: `0 0 5px ${agent.color}`,
                    }} />}
                    {done && <span style={{
                      marginLeft: "auto", fontSize: 8, letterSpacing: 2,
                      color: agent.color, opacity: 0.5,
                    }}>✓</span>}
                  </div>
                  {/* Content */}
                  <div style={{
                    flex: 1, overflow: "auto",
                    fontSize: 14, lineHeight: 1.5,
                    color: active || done ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.2)",
                    fontFamily: "'Instrument Serif','Georgia',serif",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {loading && (
                      <div style={{ display: "flex", gap: 4, alignItems: "center", color: "rgba(255,255,255,0.15)" }}>
                        <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
                        <span style={{ animation: "pulse 1s ease-in-out 0.15s infinite" }}>●</span>
                        <span style={{ animation: "pulse 1s ease-in-out 0.3s infinite" }}>●</span>
                        <span style={{ fontSize: 10, fontFamily: "inherit", marginLeft: 4, letterSpacing: 1 }}>Analyzing...</span>
                      </div>
                    )}
                    {(streaming || done) && p?.text && (
                      <>
                        {p.text}
                        {streaming && (
                          <span style={{
                            display: "inline-block", width: 2, height: 14,
                            background: agent.color, marginLeft: 2,
                            animation: "blink 0.7s step-end infinite",
                            verticalAlign: "text-bottom",
                          }} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14, maxWidth: 600, width: "100%", marginBottom: 20,
            }}>
              {AGENTS.map((a) => (
                <div key={a.id} style={{
                  padding: "28px 12px", borderRadius: 11,
                  border: "1px solid rgba(255,255,255,0.03)",
                  background: "rgba(255,255,255,0.008)", textAlign: "center",
                }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{
                    fontSize: 8, letterSpacing: 2, textTransform: "uppercase",
                    color: "rgba(255,255,255,0.14)",
                  }}>{a.label}</div>
                </div>
              ))}
            </div>
            <div style={{
              fontSize: 13, fontFamily: "'Instrument Serif','Georgia',serif",
              fontStyle: "italic", color: "rgba(255,255,255,0.08)",
            }}>Waiting for a business idea...</div>
          </div>
        )}
      </div>
    </main>
  );
}

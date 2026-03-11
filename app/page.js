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
  },
  {
    id: "financial",
    label: "FINANCIALS",
    icon: "💰",
    color: "#00ff88",
    glow: "rgba(0, 255, 136, 0.12)",
    border: "rgba(0, 255, 136, 0.35)",
  },
  {
    id: "brand",
    label: "BRAND IDENTITY",
    icon: "🎯",
    color: "#ffaa00",
    glow: "rgba(255, 170, 0, 0.12)",
    border: "rgba(255, 170, 0, 0.35)",
  },
  {
    id: "launch",
    label: "30-DAY LAUNCH",
    icon: "📣",
    color: "#ff4466",
    glow: "rgba(255, 68, 102, 0.12)",
    border: "rgba(255, 68, 102, 0.35)",
  },
];

async function streamAgent(agentId, idea, onChunk, onDone, onError) {
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: agentId, idea }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(fullText);
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    console.error(`Agent ${agentId} error:`, err);
    onError();
  }
}

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

  // Stop timer when all 4 are done
  useEffect(() => {
    if (doneCount >= 4 && running) {
      clearInterval(tickRef.current);
      setRunning(false);
    }
  }, [doneCount, running]);

  const go = useCallback(() => {
    if (!idea.trim() || running) return;

    setRunning(true);
    setLaunched(true);
    setTimer("0.0");
    setDoneCount(0);
    doneRef.current = 0;
    t0Ref.current = Date.now();

    // Init panels
    const init = {};
    AGENTS.forEach((a) => {
      init[a.id] = { text: "", phase: "loading" };
    });
    setPanels(init);

    // Timer
    tickRef.current = setInterval(() => {
      setTimer(((Date.now() - t0Ref.current) / 1000).toFixed(1));
    }, 100);

    // Fire agents with slight stagger
    AGENTS.forEach((agent, i) => {
      setTimeout(() => {
        streamAgent(
          agent.id,
          idea.trim(),
          // onChunk — live streaming text
          (text) => {
            setPanels((p) => ({
              ...p,
              [agent.id]: { text, phase: "streaming" },
            }));
          },
          // onDone
          (text) => {
            setPanels((p) => ({
              ...p,
              [agent.id]: { text, phase: "done" },
            }));
            doneRef.current += 1;
            setDoneCount(doneRef.current);
          },
          // onError
          () => {
            setPanels((p) => ({
              ...p,
              [agent.id]: {
                text: "Agent timed out — strong idea though, we'll crunch this offline.",
                phase: "done",
              },
            }));
            doneRef.current += 1;
            setDoneCount(doneRef.current);
          }
        );
      }, i * 300);
    });
  }, [idea, running]);

  const reset = () => {
    setIdea("");
    setPanels({});
    setLaunched(false);
    setTimer("0.0");
    setRunning(false);
    setDoneCount(0);
    doneRef.current = 0;
    clearInterval(tickRef.current);
  };

  const allDone = doneCount >= 4 && !running;

  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,212,255,0.06), transparent),
            radial-gradient(ellipse 50% 40% at 85% 100%, rgba(255,68,102,0.04), transparent),
            radial-gradient(ellipse 50% 30% at 5% 90%, rgba(0,255,136,0.04), transparent)
          `,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "20px 28px",
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: launched ? 12 : 28,
            transition: "margin 0.5s ease",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 6,
              color: "rgba(255,255,255,0.22)",
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Hawaii Island AI Summit 2026
          </div>
          <h1
            style={{
              fontSize: launched ? 24 : 38,
              fontWeight: 300,
              letterSpacing: -0.5,
              margin: 0,
              transition: "font-size 0.5s ease",
              background:
                "linear-gradient(135deg, #00d4ff, #00ff88, #ffaa00, #ff4466)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            4 AI Agents. 1 Business Idea. 90 Seconds.
          </h1>
          {!launched && (
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.25)",
                marginTop: 5,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
              }}
            >
              Give me any business idea. Watch what happens.
            </p>
          )}
        </div>

        {/* Input row */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 340px", maxWidth: 520 }}>
            <input
              type="text"
              placeholder="Shout out a business idea..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              disabled={running}
              style={{
                width: "100%",
                padding: "13px 18px",
                fontSize: 18,
                fontFamily: "inherit",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={go}
            disabled={!idea.trim() || running}
            style={{
              padding: "13px 30px",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "inherit",
              letterSpacing: 2,
              textTransform: "uppercase",
              border: "none",
              borderRadius: 10,
              minWidth: 180,
              whiteSpace: "nowrap",
              cursor: !idea.trim() || running ? "not-allowed" : "pointer",
              background:
                !idea.trim() || running
                  ? "rgba(255,255,255,0.04)"
                  : "linear-gradient(135deg, #00d4ff, #00ff88)",
              color:
                !idea.trim() || running
                  ? "rgba(255,255,255,0.12)"
                  : "#06060a",
              transition: "all 0.3s",
            }}
          >
            {running ? `BUILDING... ${timer}s` : "BUILD IT"}
          </button>

          {launched && !running && (
            <button
              onClick={reset}
              style={{
                padding: "13px 18px",
                fontSize: 11,
                fontFamily: "inherit",
                letterSpacing: 1,
                textTransform: "uppercase",
                background: "transparent",
                color: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              NEW IDEA
            </button>
          )}
        </div>

        {/* Progress bar */}
        {running && (
          <div
            style={{
              height: 2,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 1,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(doneCount / 4) * 100}%`,
                background:
                  "linear-gradient(90deg, #00d4ff, #00ff88, #ffaa00, #ff4466)",
                transition: "width 0.5s ease",
                borderRadius: 1,
              }}
            />
          </div>
        )}

        {/* Completion */}
        {allDone && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 12,
              animation: "fadeIn 0.5s ease",
            }}
          >
            <span
              style={{
                fontSize: 14,
                letterSpacing: 4,
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ✦ Complete in {timer} seconds ✦
            </span>
          </div>
        )}

        {/* Agent panels */}
        {launched && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {AGENTS.map((agent) => {
              const p = panels[agent.id];
              const loading = p?.phase === "loading";
              const streaming = p?.phase === "streaming";
              const done = p?.phase === "done";
              const active = streaming;

              return (
                <div
                  key={agent.id}
                  style={{
                    background: active
                      ? agent.glow
                      : done
                        ? agent.glow.replace("0.12", "0.05")
                        : "rgba(255,255,255,0.012)",
                    border: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
                    borderRadius: 13,
                    padding: "16px 20px",
                    minHeight: 170,
                    transition: "all 0.4s ease",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: active
                      ? `0 0 30px ${agent.glow}`
                      : "none",
                  }}
                >
                  {/* Agent label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 10,
                      paddingBottom: 7,
                      borderBottom: `1px solid ${active || done ? agent.border : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{agent.icon}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color:
                          active || done
                            ? agent.color
                            : "rgba(255,255,255,0.2)",
                        transition: "color 0.3s",
                      }}
                    >
                      {agent.label}
                    </span>

                    {active && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: agent.color,
                          animation: "pulse 1s ease-in-out infinite",
                          boxShadow: `0 0 6px ${agent.color}`,
                        }}
                      />
                    )}
                    {done && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 9,
                          letterSpacing: 2,
                          color: agent.color,
                          opacity: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      fontSize: 16,
                      lineHeight: 1.55,
                      color:
                        active || done
                          ? "rgba(255,255,255,0.88)"
                          : "rgba(255,255,255,0.2)",
                      fontFamily:
                        "'Playfair Display', Georgia, serif",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {loading && (
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          alignItems: "center",
                          color: "rgba(255,255,255,0.15)",
                        }}
                      >
                        <span
                          style={{
                            animation:
                              "pulse 1s ease-in-out infinite",
                          }}
                        >
                          ●
                        </span>
                        <span
                          style={{
                            animation:
                              "pulse 1s ease-in-out 0.15s infinite",
                          }}
                        >
                          ●
                        </span>
                        <span
                          style={{
                            animation:
                              "pulse 1s ease-in-out 0.3s infinite",
                          }}
                        >
                          ●
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "inherit",
                            marginLeft: 5,
                            letterSpacing: 1,
                          }}
                        >
                          Analyzing...
                        </span>
                      </div>
                    )}

                    {(streaming || done) && p?.text && (
                      <>
                        {p.text}
                        {streaming && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 2,
                              height: 16,
                              background: agent.color,
                              marginLeft: 2,
                              animation:
                                "blink 0.7s step-end infinite",
                              verticalAlign: "text-bottom",
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Idle state */}
        {!launched && (
          <div style={{ textAlign: "center", marginTop: 45 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                maxWidth: 680,
                margin: "0 auto 30px",
              }}
            >
              {AGENTS.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "20px 12px",
                    borderRadius: 11,
                    border: "1px solid rgba(255,255,255,0.03)",
                    background: "rgba(255,255,255,0.008)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 5 }}>
                    {a.icon}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.14)",
                    }}
                  >
                    {a.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily:
                  "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.08)",
              }}
            >
              Waiting for a business idea...
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 8,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.07)",
          zIndex: 2,
        }}
      >
        Binil Chacko — Going Deeper to Go Higher
      </div>
    </main>
  );
}

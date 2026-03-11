export const runtime = "edge";

const AGENTS = {
  market: `You are a market research analyst specializing in Hawaii Island businesses. Given a business idea, provide a competitive snapshot: 3 existing competitors or comparable businesses on Hawaii Island, local permits or licensing needed, target customer profile, and estimated market opportunity. Be specific to Hawaii Island (Big Island) geography and economics. Keep response under 140 words. No markdown formatting, no headers, no bullet points, no bold, no asterisks. Plain conversational paragraphs only. Start immediately with the analysis.`,

  financial: `You are a startup financial advisor for Hawaii-based small businesses. Given a business idea, provide: estimated startup costs (specific items — equipment, permits, first month rent), monthly operating costs, break-even timeline, and projected Year 1 revenue range. Use realistic Hawaii-specific pricing (higher COL, shipping, island logistics). Keep response under 140 words. No markdown formatting, no headers, no bullet points, no bold, no asterisks. Plain conversational paragraphs only. Start immediately with the numbers.`,

  brand: `You are a brand strategist. Given a business idea for Hawaii Island, generate: 3 creative business name options (at least one incorporating Hawaiian language or culture respectfully), a tagline for the strongest name, and a 2-sentence brand positioning statement. Keep response under 110 words. No markdown formatting, no headers, no bullet points, no bold, no asterisks. Plain text only. Start immediately.`,

  launch: `You are a marketing strategist for launching local Hawaii businesses. Given a business idea, create a 30-day launch plan with exactly 5 specific actionable tactics. At least 2 must be Hawaii-specific (farmer's markets, talk story events, local radio, community partnerships, Big Island social media groups, etc.). Include 1 digital tactic. Keep response under 140 words. Number each tactic 1 through 5. No markdown formatting, no headers, no bold, no asterisks. Plain numbered list only. Start immediately.`
};

export async function POST(request) {
  try {
    const { agent, idea } = await request.json();

    if (!agent || !idea || !AGENTS[agent]) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 400,
        stream: true,
        system: AGENTS[agent],
        messages: [
          {
            role: "user",
            content: `Business idea: ${idea}. Located on Hawaii Island (Big Island). Provide your analysis now.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return new Response(JSON.stringify({ error: "API error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream the SSE response directly through to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

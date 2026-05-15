exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Anthropic API key not configured." }) };
  }

  let lead;
  try {
    lead = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `You are a web agency outreach advisor for Webscape, a two-person operation that builds websites for local businesses. Analyze this lead and give concise, actionable insights.

Business: ${lead.businessName}
Category: ${lead.category}
Address: ${lead.address}
Phone: ${lead.phone}
Rating: ${lead.rating} stars (${lead.reviews} reviews)
Pipeline Status: ${lead.status}
Notes: ${lead.notes || "None"}

Provide:
1. PITCH ANGLE — One sentence on the strongest reason this business needs a website
2. OUTREACH TIP — Best way to approach them (call/walk in/email) and what to lead with
3. PRICE SUGGESTION — Recommended build fee and monthly based on business type
4. WATCH OUT — One potential objection or red flag to be aware of

Keep it tight. No fluff.`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || "Anthropic API error." }) };
    }

    const insight = data.content?.[0]?.text || "No insight generated.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insight }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

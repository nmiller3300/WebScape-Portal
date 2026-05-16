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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a business development strategist for Webscape, a local web design company in North Georgia. Analyze this lead and produce a sharp, specific, actionable report. No fluff. No generic statements. Everything must be specific to this exact business type and market.

LEAD:
Business: ${lead.businessName}
Category: ${lead.category}
Address: ${lead.address}
Phone: ${lead.phone}
Rating: ${lead.rating} stars (${lead.reviews} reviews)
Notes: ${lead.notes || "None"}

Write these four sections:

BUSINESS ASSESSMENT
2-3 sentences. What does this specific type of business look like operationally? How do they get customers today without a website? What is their biggest blind spot digitally?

PITCH ANGLE & OUTREACH
3-4 sentences. What is the strongest reason this specific category of business needs a website right now? How should Webscape approach them — call, walk in, or email? What exact opening line will get the owner to listen?

OBJECTIONS & RESPONSES
List the 2 most likely objections from this type of owner. One sentence response to each that is honest and direct.

PRICING & CONFIDENCE
Recommend a specific build fee and monthly rate for this business type. Then rate this lead 1-10 with one sentence explaining why.`,
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

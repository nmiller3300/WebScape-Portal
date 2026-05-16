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
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are a senior business development strategist and web consultant for Webscape, a local web design company serving small businesses in North Georgia. You have been given a lead profile for a potential client. Your job is to produce a thorough, researched analysis of this business that the Webscape team can use to craft a highly personalized and effective pitch.

This is not a generic summary. Think critically about this specific business, their industry, their likely customer base, their competitive landscape, and what having or not having a website means for them specifically. Write like a consultant who actually knows this space.

LEAD PROFILE:
Business Name: ${lead.businessName}
Category: ${lead.category}
Address: ${lead.address}
Phone: ${lead.phone}
Google Rating: ${lead.rating} stars
Number of Reviews: ${lead.reviews}
Pipeline Status: ${lead.status}
Team Notes: ${lead.notes || "None yet"}

Produce your full analysis in these sections:

BUSINESS ASSESSMENT
Analyze what this business likely looks like based on its category, rating, and review count. What kind of operation is it probably running? Is it established or newer? What does their customer base likely look like and how do they find new customers today?

DIGITAL PRESENCE GAP
Explain specifically what this type of business loses by not having a website. Be specific to their category — not generic. What searches are they missing right now? What customers are going to competitors who show up on Google? What trust signals are they failing to provide to someone who looks them up before visiting?

COMPETITOR CONTEXT
What do competing businesses in this category typically do online in a suburban Georgia market like Flowery Branch, Gainesville, or Buford? Do most have websites? Are they active on Google Business? What does the owner see when they look up their own competitors?

PITCH ANGLE
What is the single strongest angle for approaching this specific business? What pain do they feel most acutely right now? Frame the pitch around the outcome they want, not the product you are selling.

OUTREACH STRATEGY
How should Webscape approach this specific owner? Call, walk in, or email first? What time of day and day of week works best for this category? What is the exact opening that will make them listen instead of dismiss the call?

LIKELY OBJECTIONS
List the 3 most likely objections this owner will raise. For each one write a direct, honest response that addresses the real concern without being pushy or salesy.

PRICING RECOMMENDATION
Recommend a specific build fee and monthly hosting fee for this business. Explain why that price point is right for their category and scale, and what the deliverable should include to justify it.

CONFIDENCE SCORE
Rate this lead 1 to 10 and explain your reasoning based on rating, review count, category demand for websites, and local market context.`,
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

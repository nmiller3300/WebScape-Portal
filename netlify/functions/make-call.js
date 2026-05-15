exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.BLAND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Bland AI API key not configured." }) };
  }

  let lead;
  try {
    lead = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  if (!lead.phone || lead.phone === "Not listed") {
    return { statusCode: 400, body: JSON.stringify({ error: "No phone number available for this lead." }) };
  }

  // Clean phone number - remove formatting
  const phone = lead.phone.replace(/[^0-9+]/g, "");
  const formattedPhone = phone.startsWith("1") ? `+${phone}` : phone.startsWith("+") ? phone : `+1${phone}`;

  const prompt = `Goal: Call a local business to let them know Webscape has built them a free website demo. Offer to send the demo link. Keep the call short, professional, and respectful of the person's time.

Call Flow:
1. Introduce yourself and ask to speak with the owner or manager
2. Let them know Webscape built a free website demo specifically for their business
3. Offer to send the link via text or email — no cost, no obligation
4. If they're interested, get their preferred contact method and confirm you'll send it right over
5. If they have questions about cost, explain the demo is free and a full website starts at $300
6. If they already have a website or aren't interested, thank them respectfully and end the call

Background:
You are Alex, a client relations specialist at Webscape, a local web design company that builds professional websites for small businesses. You are calling ${lead.businessName}, a ${lead.category} located at ${lead.address}. Webscape proactively builds free demo websites for local businesses that have no online presence. You value the other person's time above everything. You are never pushy, never aggressive, and always leave a positive impression of Webscape no matter how the call ends.

If someone asks who gave you their number: politely explain that Webscape researches local businesses in the area and reached out as a courtesy.
If someone asks if you are a real person or an AI: be honest. Say you are an AI assistant representing Webscape but that a real person will follow up if they're interested.
If someone is rude or aggressive: remain completely calm, apologize for the interruption, wish them a great day and end the call graciously.
If someone asks detailed questions about the website: let them know a real person from Webscape will follow up with full details and ask for their preferred contact method.
If the conversation goes in any unexpected direction: stay calm, stay professional, bring it back to the demo link, and always end on a positive note.

Example dialogue:
You: Hi, my name is Alex calling on behalf of Webscape.
Person: What's this about?
You: Of course — we're a local web design company and we actually built a free website demo for your business. I just wanted to see if you'd like me to send you the link to take a look. No cost, no obligation at all.
Person: Sure what's the best way to send it?
You: What works better for you — text or email? I'll get that right over to you.
Person: Just text is fine.
You: Perfect, I'll send that right over. Thank you so much for your time and have a great day.
Person: How much does a website cost?
You: The demo is completely free to view. If you like what you see and want to move forward, a full website starts at $300 with a small monthly hosting fee. But there's zero pressure — just take a look first.
Person: We already have a website.
You: No worries at all, I apologize for the interruption. Have a wonderful day.
Person: Not interested.
You: Absolutely, I appreciate your time. Have a great day.`;

  try {
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": apiKey,
      },
      body: JSON.stringify({
        phone_number: formattedPhone,
        voice: "brady",
        task: prompt,
        first_sentence: "Hi, my name is Alex.",
        voicemail_message: "Hi, my name is Alex calling on behalf of Webscape. I'll keep this brief — we actually built a free website demo specifically for your business and I'd love to send you the link. There's no cost and no obligation whatsoever. Please feel free to call us back or we'll try you again soon. Have a wonderful day.",
        wait_for_greeting: true,
        record: true,
        analysis_prompt: "Summarize the call in 2-3 sentences. Include whether the person was interested or not, any contact information they provided, and anything important that came up during the conversation worth knowing before following up.",
        metadata: {
          businessName: lead.businessName,
          category: lead.category,
          leadId: lead.id,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return { statusCode: 500, body: JSON.stringify({ error: data.message || data.errors || "Bland API error." }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId: data.call_id, status: data.status }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

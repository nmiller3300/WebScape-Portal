exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "SerpApi key not configured." }) };
  }

  let zip, category;
  try {
    const body = JSON.parse(event.body);
    zip = body.zip;
    category = body.category || "business";
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  if (!zip) {
    return { statusCode: 400, body: JSON.stringify({ error: "ZIP code is required." }) };
  }

  try {
    const params = new URLSearchParams({
      engine: "google_maps",
      q: `${category} in ${zip}`,
      type: "search",
      api_key: apiKey,
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await response.json();

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error }) };
    }

    const places = data.local_results || [];

    // Filter for businesses with no website — these are our targets
    const leads = places
      .filter((p) => !p.website)
      .map((p, i) => ({
        id: Date.now() + i,
        businessName: p.title || "Unknown Business",
        category: category,
        address: p.address || "",
        phone: p.phone || "Not listed",
        rating: p.rating || 0,
        reviews: p.reviews || 0,
        zip: zip,
        status: "new",
        priority: false,
        source: "Google Maps",
        hasWebsite: false,
        assignedTo: null,
        coWorkers: [],
        claimedBy: null,
        claimedAt: null,
        demoLink: "",
        notes: [],
        outreachLog: [],
        payment: {
          amount: "",
          monthly: "",
          billingName: "",
          billingEmail: "",
          paymentLink: "",
          status: "unpaid",
        },
      }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, total: places.length, noWebsite: leads.length, zip }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};


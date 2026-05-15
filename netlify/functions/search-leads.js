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
    const params1 = new URLSearchParams({ engine:"google_maps", q:`${category} in ${zip}`, type:"search", start:"0", api_key:apiKey });
    const params2 = new URLSearchParams({ engine:"google_maps", q:`${category} near ${zip} Georgia`, type:"search", start:"0", api_key:apiKey });

    const [res1, res2] = await Promise.all([
      fetch(`https://serpapi.com/search.json?${params1}`).then(r=>r.json()),
      fetch(`https://serpapi.com/search.json?${params2}`).then(r=>r.json()),
    ]);

    if (res1.error && res2.error) {
      return { statusCode: 500, body: JSON.stringify({ error: res1.error }) };
    }

    // Merge results from both queries, deduplicate by title
    const seen = new Set();
    const allPlaces = [];
    for (const data of [res1, res2]) {
      const places = data.local_results || data.places_results || [];
      for (const p of places) {
        const key = (p.title||p.name||"").toLowerCase();
        if (key && !seen.has(key)) { seen.add(key); allPlaces.push(p); }
      }
    }

    const leads = allPlaces
      .filter((p) => { const hasWebsite = p.website || p.website_link || p.website_url; return !hasWebsite; })
      .map((p) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        businessName: p.title || p.name || "Unknown Business",
        category: category,
        address: p.address || p.vicinity || "",
        phone: p.phone || p.formatted_phone_number || "Not listed",
        rating: p.rating || 0,
        reviews: p.reviews || p.user_ratings_total || 0,
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
        payment: { amount:"", monthly:"", billingName:"", billingEmail:"", paymentLink:"", status:"unpaid" },
      }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, total: allPlaces.length, noWebsite: leads.length, zip }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};



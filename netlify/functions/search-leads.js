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

    // SerpApi can return results under different keys
    const places = data.local_results || data.places_results || data.local_ads || [];

    // Filter for businesses with no website
    // Check all possible website field names SerpApi might use
    const leads = places
      .filter((p) => {
        const hasWebsite = p.website || p.website_link || p.website_url;
        return !hasWebsite;
      })
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
      body: JSON.stringify({
        leads,
        total: places.length,
        noWebsite: leads.length,
        zip,
        // Debug info so we can see what came back
        _debug: {
          resultKey: data.local_results ? "local_results" : data.places_results ? "places_results" : "none",
          rawCount: places.length,
          searchInfo: data.search_information,
        },
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};



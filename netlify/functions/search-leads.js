exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Google Places API key not configured." }) };
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
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.types,places.businessStatus",
      },
      body: JSON.stringify({
        textQuery: `${category} in ${zip}`,
        maxResultCount: 20,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || "Google API error." }) };
    }

    const places = data.places || [];

    // Filter for businesses with no website — these are our targets
    const leads = places
      .filter((p) => !p.websiteUri && p.businessStatus === "OPERATIONAL")
      .map((p, i) => ({
        id: Date.now() + i,
        businessName: p.displayName?.text || "Unknown Business",
        category: category,
        address: p.formattedAddress || "",
        phone: p.nationalPhoneNumber || "Not listed",
        rating: p.rating || 0,
        reviews: p.userRatingCount || 0,
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

    // Log the zip to history
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, total: places.length, noWebsite: leads.length, zip }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

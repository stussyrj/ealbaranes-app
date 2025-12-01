interface GooglePlacePrediction {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface GooglePlaceDetails {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
  postcode?: string;
  country?: string;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY no está configurada en las variables de entorno");
  }
  return key;
}

function extractPostalCode(details: GooglePlaceDetails): string | undefined {
  const postalComponent = details.address_components.find((comp) =>
    comp.types.includes("postal_code")
  );
  return postalComponent?.long_name;
}

function extractCountry(details: GooglePlaceDetails): string | undefined {
  const countryComponent = details.address_components.find((comp) =>
    comp.types.includes("country")
  );
  return countryComponent?.long_name;
}

export async function getAddressSuggestionsGoogle(
  text: string
): Promise<AddressSuggestion[]> {
  if (!text || text.length < 2) return [];

  const apiKey = getApiKey();

  try {
    // First, get predictions from Places Autocomplete API
    const predictionsUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const predictionsParams = new URLSearchParams({
      input: text,
      key: apiKey,
      language: "es",
      region: "es",
      // Restricts results to Spain, Portugal, France
      components: "country:es|country:pt|country:fr",
    });

    const predictionsResponse = await fetch(
      `${predictionsUrl}?${predictionsParams}`,
      {
        method: "GET",
        headers: { "Accept": "application/json" },
      }
    );

    if (!predictionsResponse.ok) {
      console.error("Error fetching places predictions:", predictionsResponse.status);
      return [];
    }

    const predictionsData = (await predictionsResponse.json()) as {
      predictions?: GooglePlacePrediction[];
      status?: string;
    };

    if (!predictionsData.predictions || predictionsData.predictions.length === 0) {
      return [];
    }

    // Take only top 3 predictions
    const topPredictions = predictionsData.predictions.slice(0, 3);

    // Fetch details for each prediction to get coordinates and postal code
    const suggestions: AddressSuggestion[] = [];

    for (const prediction of topPredictions) {
      try {
        const detailsUrl = "https://maps.googleapis.com/maps/api/place/details/json";
        const detailsParams = new URLSearchParams({
          place_id: prediction.place_id,
          key: apiKey,
          language: "es",
          fields: "formatted_address,geometry,address_components",
        });

        const detailsResponse = await fetch(
          `${detailsUrl}?${detailsParams}`,
          {
            method: "GET",
            headers: { "Accept": "application/json" },
          }
        );

        if (!detailsResponse.ok) continue;

        const detailsData = (await detailsResponse.json()) as {
          result?: GooglePlaceDetails;
          status?: string;
        };

        if (!detailsData.result) continue;

        const details = detailsData.result;
        const postcode = extractPostalCode(details);
        const country = extractCountry(details);

        // Build comprehensive label with postcode
        let label = prediction.description;
        if (postcode && !label.includes(postcode)) {
          label = `${label}, ${postcode}`;
        }

        suggestions.push({
          label,
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
          postcode,
          country,
        });
      } catch (error) {
        console.error("Error fetching place details:", error);
        // Continue to next prediction if this one fails
        continue;
      }
    }

    return suggestions;
  } catch (error) {
    console.error("Error in getAddressSuggestionsGoogle:", error);
    return [];
  }
}

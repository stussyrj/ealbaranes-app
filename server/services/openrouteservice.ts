interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
  country: string;
}

interface RouteResult {
  km: number;
  durationMin: number;
  raw?: object;
}

const ORS_BASE_URL = "https://api.openrouteservice.org";

function getApiKey(): string {
  const key = process.env.ORS_API_KEY;
  if (!key) {
    throw new Error("ORS_API_KEY no está configurada en las variables de entorno");
  }
  return key;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = getApiKey();
  
  const params = new URLSearchParams({
    api_key: apiKey,
    text: address,
    size: "1",
    "boundary.country": "ES,PT,FR",
  });
  
  const url = `${ORS_BASE_URL}/geocode/search?${params}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de geocodificación ORS: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error(`No se encontraron resultados para la dirección: ${address}`);
  }
  
  const feature = data.features[0];
  const [lng, lat] = feature.geometry.coordinates;
  const properties = feature.properties;
  
  return {
    lat,
    lng,
    label: properties.label || address,
    country: properties.country || "España",
  };
}

export async function getRouteDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult> {
  const apiKey = getApiKey();
  
  const start = [Number(origin.lng), Number(origin.lat)];
  const end = [Number(destination.lng), Number(destination.lat)];
  
  console.log("🗺️ Route Request - Origin:", origin, "Destination:", destination);
  console.log("📍 Coordinates - Start:", start, "End:", end);
  
  const url = `${ORS_BASE_URL}/v2/directions/driving-car/geojson`;
  const body = {
    coordinates: [start, end],
    preference: "fastest",
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de ruta ORS: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  if (
    !data.features ||
    !data.features[0] ||
    !data.features[0].properties ||
    !data.features[0].properties.summary
  ) {
    throw new Error("Respuesta ORS no contiene datos de ruta válidos");
  }
  
  const summary = data.features[0].properties.summary;
  const meters = summary.distance;
  const seconds = summary.duration;
  
  console.log("✅ Route Response - Distance (meters):", meters, "Duration (seconds):", seconds);
  
  const km = Math.round((meters / 1000) * 100) / 100;
  const durationMin = Math.round(seconds / 60);
  
  console.log("📊 Calculated - Distance (km):", km, "Duration (min):", durationMin);
  
  return { km, durationMin, raw: data };
}

export async function calculateRouteFromAddresses(
  originAddress: string,
  destinationAddress: string
): Promise<{
  origin: GeocodeResult;
  destination: GeocodeResult;
  route: RouteResult;
}> {
  const [origin, destination] = await Promise.all([
    geocodeAddress(originAddress),
    geocodeAddress(destinationAddress),
  ]);
  
  const route = await getRouteDistance(
    { lat: origin.lat, lng: origin.lng },
    { lat: destination.lat, lng: destination.lng }
  );
  
  return { origin, destination, route };
}

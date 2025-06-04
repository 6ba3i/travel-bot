let token = '';
let expires = 0;

// get & cache Amadeus OAuth token
async function getToken() {
  if (token && Date.now() < expires) return token;

  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method : 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body   : new URLSearchParams({
      grant_type   : 'client_credentials',
      client_id    : process.env.AMA_ID,
      client_secret: process.env.AMA_SECRET
    })
  });
  const json = await res.json();
  token   = json.access_token;
  expires = Date.now() + json.expires_in * 1000 - 60_000; // renew 1 min early
  return token;
}

export async function searchHotels({ cityCode, checkIn, nights = 1 }) {
  const bearer = await getToken();
  const res = await fetch(
    `https://test.api.amadeus.com/v1/shopping/hotel-offers?cityCode=${cityCode}&adults=1&roomQuantity=1&checkInDate=${checkIn}&checkOutDate=${nextDate(checkIn, nights)}&bestRateOnly=true`,
    { headers: { Authorization: `Bearer ${bearer}` } }
  );
  if (!res.ok) throw new Error(await res.text());
  return await res.json();            // { data: [...] }
}

function nextDate(yyyy_mm_dd, nights) {
  const d = new Date(yyyy_mm_dd);
  d.setDate(d.getDate() + nights);
  return d.toISOString().slice(0, 10);
}

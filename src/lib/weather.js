export async function getWeather({ lat, lon }) {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${process.env.OWM_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();   // { daily: [...] }
  }
  
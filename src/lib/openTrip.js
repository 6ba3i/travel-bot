export async function searchPOI({ location, kinds = '', limit = 10 }) {
    const key = process.env.OTM_KEY;
  
    // if location is "lat,lng" use it directly, else geocode the city
    let lat, lon;
    if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(location)) {
      [lat, lon] = location.split(',');
    } else {
      const geo = await fetch(
        `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(location)}&apikey=${key}`
      ).then(r => r.json());
      ({ lat, lon } = geo);
    }
  
    const pois = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&kinds=${kinds}&limit=${limit}&apikey=${key}`
    ).then(r => r.json());
  
    return pois.features.map(f => ({
      name : f.properties.name || '(no name)',
      link : `https://opentripmap.com/en/poi/${f.properties.xid}`
    }));
  }
  
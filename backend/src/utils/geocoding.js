const https = require('https');

// Convierte coordenadas a ciudad/departamento/distrito usando Google Geocoding API
async function reverseGeocode(lat, lng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status !== 'OK' || !json.results.length) { resolve({}); return; }
          const comps = json.results[0].address_components;
          const get = (type) => comps.find(c => c.types.includes(type))?.long_name ?? null;
          resolve({
            ciudad:       get('locality') || get('administrative_area_level_2'),
            departamento: get('administrative_area_level_1'),
            distrito:     get('sublocality_level_1') || get('locality'),
          });
        } catch { resolve({}); }
      });
      res.on('error', () => resolve({}));
    }).on('error', () => resolve({}));
  });
}

module.exports = { reverseGeocode };

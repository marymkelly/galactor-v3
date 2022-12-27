const {geodeticToCelestialCoords} = require("./calculation");
const {fetcher} = require("./fetcher");

async function getPlace(input) {
  const query = typeof input === "object" ? `latlng=${input.lat},${input.lng}&location_type=APPROXIMATE` : `place_id=${input}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${query}&key=${process.env.GEOCODER_API_KEY}`;
  const data = await fetcher({method: "get", url});

  return new Promise((resolve, reject) => {
    if (data?.results?.length === 0) {
      reject(new Error("no location found"));
    }

    const coords = data.results[0].geometry.location;
    coords.celestial = geodeticToCelestialCoords(coords.lat, coords.lng);
    const formattedLocation = data.results[0].formatted_address;

    resolve({coords, formattedLocation});
  });
}

module.exports = {getPlace};

function geodeticToCelestialCoords(lat, lng) {
	let dec = lat; //latitude from geolocation should coorespond with angle of declination (range: 0-90)
	let ra = lng < 0 ? (lng + 360) / 15 : lng / 15; //right ascention in hours (range: 0-24)

	return { dec: round(dec, 7), ra: round(ra, 7) };
}

function celestialToGeodeticCoords(ra, dec) {
	let lat = dec; //latitude from geolocation should coorespond with angle of declination (range: 0-90)
	let lng = ra * 15 > 180 ? ra * 15 - 360 : ra * 15; //right ascention in hours (range: 0-24)

	return { lat: round(lat, 10), lng: round(lng, 10) };
}

function round(num, decimalPlaces) {
	const tensFactor = Math.pow(10, decimalPlaces);
	return Math.round(num * tensFactor) / tensFactor;
}

module.exports = { geodeticToCelestialCoords, celestialToGeodeticCoords, round };

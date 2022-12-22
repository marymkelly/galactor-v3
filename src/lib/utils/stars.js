const axios = require("axios");
const xml2js = require("xml2js");

//default coordinates Cape Canaveral
async function getStars(ra = 28.4, dec = -80.6, opts) {
	//retrieve nearby stars from database
	const getStarsUrl = `http://server2.sky-map.org/getstars.jsp?ra=${ra}&de=${dec}&angle=${opts?.alt ?? 30}&max_stars=${opts?.qty ?? 10}`;

	try {
		let response = await axios.get(getStarsUrl);
		let parsedData = await xml2js.parseStringPromise(response.data, { trim: true });

		//double check star names in seasame database -- invalid names will not render in aladin container
		const validateStars = parsedData.response.star.map(async (star) => {
			const validateStarsUrl = "http://vizier.cfa.harvard.edu/viz-bin/nph-sesame/-ox2F/S~?" + encodeURIComponent(star.catId);
			try {
				let response = await axios.get(validateStarsUrl);
				let parsedData = await xml2js.parseStringPromise(response.data, { trim: true });

				if (parsedData.Sesame.INFO || !parsedData.Sesame.Resolver) return;

				star.target = parsedData.Sesame.target;
				return star;
			} catch (error) {
				console.log("vizier database error", error);
				return { error };
			}
		});

		const validateResults = await Promise.all(validateStars);

		if (!validateResults) {
			throw new Error("No stars found");
		}

		return { stars: validateResults.filter((stars) => stars) };
	} catch (error) {
		return { error };
	}
}

module.exports = { getStars };

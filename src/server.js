//modules
require("@babel/polyfill");
const path = require("path");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { fetcher } = require("./lib/utils/fetcher");
const { getPlace } = require("./lib/utils/location.js");
const { getStars } = require("./lib/utils/stars.js");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.options("*", cors());
app.get("/", function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.sendFile("index.html");
});

app.post("/api/location/geolocate", async function (req, res) {
	const query = req.body?.location;
	const qty = req.body?.qty;
	const alt = req.body?.altitude;

	const url =
		`https://maps.googleapis.com/maps/api/place/queryautocomplete/json?input=` +
		encodeURI(query) +
		`&types=geocode&key=${process.env.GEOCODER_API_KEY}`;

	const geodata = await fetcher({ method: "get", url });

	if (!geodata?.predictions?.[0]) return res.status(400).send({ error: geodata });

	const place = await getPlace(geodata.predictions[0].place_id)
		.then((res) => res)
		.catch((err) => err);

	const starData = await getStars(place.coords.celestial.ra, place.coords.celestial.dec, { qty, alt });

	res.status(200).send({ location: { ...place }, ...starData });
});

app.get("*", (req, res) => {
	res.redirect("/");
});

app.listen(port, () => {
	console.log(`Server listening at port: ${port}`);
});

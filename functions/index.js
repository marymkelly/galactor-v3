require("@babel/polyfill");
const functions = require("firebase-functions");
const path = require("path");
const express = require("express");
const cors = require("cors")({origin: true});
const {fetcher} = require("./lib/fetcher.js");
const {getPlace} = require("./lib/location.js");
const {getStars} = require("./lib/stars.js");

const app = express();
app.use(cors);
app.use(express.static(path.join(__dirname, "dist")));
app.get("/", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.sendFile("index.html");
});

app.post("/api/location/geolocate", async function(req, res) {
  const query = req.body?.location;
  const qty = req.body?.qty;
  const alt = req.body?.altitude;

  const url = "https://maps.googleapis.com/maps/api/place/queryautocomplete/json?input=" + encodeURI(query) + `&types=geocode&key=${process.env.GEOCODER_API_KEY}`;

  const geodata = await fetcher({method: "get", url});

  if (!geodata?.predictions?.[0]) return res.status(400).send({error: geodata});

  const place = await getPlace(geodata.predictions[0].place_id)
      .then((res) => res)
      .catch((err) => err);

  const starData = await getStars(place.coords.celestial.ra, place.coords.celestial.dec, {qty, alt});

  res.status(200).send({location: {...place}, ...starData});
});

app.get("*", (req, res) => {
  res.redirect("/");
});

exports.app = functions.https.onRequest(app);
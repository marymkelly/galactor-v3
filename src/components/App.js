import React, { useState, useEffect, useRef } from "react";
import { hot } from "react-hot-loader/root";
import Globe from "react-globe.gl";
import * as THREE from "three";
import axios from "axios";
import LoadingOverlay from "./LoadingOverlay";
import { celestialToGeodeticCoords } from "../lib/utils/calculation.mjs";
import { threeDMarker } from "../lib/mapMarker.js";

const App = () => {
	const EARTH_RADIUS_KM = 6371; // km
	const SAT_SIZE = 80; // km
	const time = new Date();

	const globeEl = useRef();
	const aladinEl = useRef();
	const timerRef = useRef();
	const [globeRadius, setGlobeRadius] = useState();
	const [globeContainer, setGlobeContainer] = useState({ width: 600, height: 1000 });
	const [currentLocation, setCurrentLocation] = useState();
	const [locationMarkers, setLocationMarkers] = useState([{ lat: 28.4, lng: -80.64, size: 15 }]);
	const [objectsData, setObjectsData] = useState([]);
	const [altitudeAngle, setAltitudeAngle] = useState(30);
	const [starQty, setStarQty] = useState(10);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [hovering, setHovering] = useState(true);
	const [aladinSelected, setAladinSelected] = useState();

	function updateStarView(obj) {
		setAladinSelected(obj);
		aladinEl.current.gotoObject(obj.data.target);
		aladinEl.current.adjustFovForObject(obj.data.target);
	}

	function updateLocation(location) {
		setCurrentLocation(location);
		setLocationMarkers([{ ...locationMarkers[0], lng: location?.coords?.lng, lat: location?.coords?.lat }]);
		setCurrentLocation(location.formattedLocation);
		globeEl.current.pointOfView({ lng: location?.coords?.lng, lat: location?.coords?.lat }, 1500);
		aladinEl.current.gotoRaDec(location?.coords?.celestial?.ra, location?.coords?.celestial?.dec);
	}

	function updateStars(stars) {
		const formatted = stars.map((star) => {
			return {
				alt: Math.max(star.mag[0] / 10, 0.12),
				...celestialToGeodeticCoords(star.ra, star.de),
				name: star?.catId?.[0] ?? star?.target?.[0],
				data: star,
			};
		});

		setObjectsData(formatted);
		const cat = A.catalog({ color: "transparent", sourceSize: 14, shape: "circle", onClick: "objectClicked" });
		const sourcesArr = [];
		if (aladinEl?.current?.view?.catalogs[0]) {
			aladinEl.current.view.catalogs[0].sources = [];
			aladinEl.current.view.catalogs.pop();
		}

		formatted.forEach((item) => {
			sourcesArr.push(A.source(item.data.ra[0], item.data.de[0], { name: item.data.catId[0], target: item.data.target[0] }));
		});

		aladinEl.current.addCatalog(cat);
		cat.addSources(sourcesArr);

		updateStarView(sourcesArr[0]);
	}

	function getStarObject3D(active = false) {
		const planeGeometry = new THREE.PlaneGeometry(2.5, 2.5);
		const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0, side: THREE.DoubleSide });
		const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
		planeMesh.rotateX(0).rotateY(0).rotateZ(18.06);

		const ringGeometry = new THREE.RingGeometry(1.6, 2, 4);
		const ringMaterial = new THREE.MeshBasicMaterial({ color: "#0000ff", transparent: true, opacity: active ? 1 : 0, side: THREE.DoubleSide });
		const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
		ringMesh.rotateX(90).rotateY(45).rotateZ(90);

		const starGeometry = new THREE.OctahedronGeometry((SAT_SIZE * globeRadius) / EARTH_RADIUS_KM / 2, 0);
		const starMaterial = new THREE.MeshPhongMaterial({
			color: "#dfdbc8",
			emissive: "#007ab8",
			specular: "#2332a9",
			shininess: 38.9,
			reflectivity: 0.491,
			refractionRatio: 0.529,
			transparent: true,
			opacity: 0.8,
		});
		const starMesh = new THREE.Mesh(starGeometry, starMaterial);
		const starObj = ringMesh.add(planeMesh).add(starMesh);
		return starObj;
	}

	useEffect(() => {
		function handleGlobeContainer() {
			setGlobeContainer({
				width:
					window.visualViewport.width < 500
						? window.visualViewport.width * (10.5 / 12)
						: window.visualViewport.width * (5 / 12) >= 500
						? window.visualViewport.width - 500
						: window.visualViewport.width * (7 / 12),
				height: window.visualViewport.height,
			});
		}

		aladinEl.current = A.aladin("#aladin-lite-div", {
			survey: "P/DSS2/color",
			cooFrame: "ICRSd",
			showReticle: false,
			showZoomControl: false,
			showFullscreenControl: false,
			showLayersControl: false,
			showGotoControl: false,
			showShareControl: false,
			showSimbadPointerControl: false,
			showFrame: false,
			fullScreen: false,
			showFov: false,
		});

		if (window) {
			setGlobeRadius(globeEl.current.getGlobeRadius());
			globeEl.current.pointOfView({ altitude: 3 });
			handleGlobeContainer();
		}
		window.addEventListener("resize", handleGlobeContainer);

		() => window.removeEventListener("resize", handleGlobeContainer);
	}, []);

	useEffect(() => {
		(async () => {
			await axios({
				method: "post",
				url: "http://localhost:4000/api/location/geolocate",
				data: {
					location: "Cape Canaveral",
				},
			})
				.then((data) => {
					updateLocation(data.data.location);
					updateStars(data.data.stars);
					setLoading(false);
					return data;
				})
				.catch((err) => err);
		})();
	}, []);

	useEffect(() => {
		if (hovering) {
			aladinEl.current.gotoObject(hovering.name);
		} else {
			if (aladinSelected) {
				aladinEl.current.gotoObject(aladinSelected.data.name);
			}
		}
	}, [hovering]);

	useEffect(() => {
		if (timerRef.current?.slider) {
			if (timerRef.current?.timer) clearTimeout(timerRef.current?.timer);

			timerRef.current = {
				...timerRef?.current,
				timer: setTimeout(() => {
					document.getElementById("submit").click();
					timerRef.current = { timer: null, slider: false };
					setLoading(true);
				}, 1200),
			};
		}
	}, [altitudeAngle, starQty]);

	return (
		<div className='w-full h-full flex flex-col md:flex-row overflow-hidden font-questrial tracking-[.016em] overscroll-none bg-emerald-300/80'>
			<LoadingOverlay loading={loading} />
			<div className='flex flex-col w-full md:w-5/12 p-8 pl-10 pt-16 md:pt-10 justify-center items-center md:max-w-[500px]'>
				<div className='w-full max-w-[370px] h-full flex flex-col justify-center'>
					<h1 className='text-7xl md:text-8xl text-slate-800 font-title mb-12 md:mb-16'>Galactor III</h1>
					<form
						id='form'
						className='flex flex-col w-full h-auto flex-1 mb-16'
						onSubmit={async (e) => {
							e.preventDefault();
							if (!loading) setLoading(true);

							const res = await axios
								.post("http://localhost:4000/api/location/geolocate", {
									location: currentLocation,
									qty: starQty,
									altitude: altitudeAngle,
								})
								.catch((err) => err.response.data);

							if (res?.error) {
								setError(res.error);
							} else {
								if (res.data.location) {
									updateLocation(res.data.location);
									updateStars(res.data.stars);
									setLoading(false);
								}
							}
						}}>
						<div className='flex flex-col w-full'>
							<label htmlFor='currentLocation' className='text-xs mb-1 opacity-80'>
								Current Location
							</label>
							<input
								name='currentLocations'
								onChange={(e) => {
									setCurrentLocation(e.target.value);
								}}
								className={`w-full h-12 border border-opacity-30 border-emerald-800 bg-emerald-400 bg-opacity-50 focus:outline-[0px] placeholder:font-normal placeholder:text-slate-500 text-slate-800/90 text-lg font-medium focus:outline-offset-0 focus:border-cyan-600/80 ring-cyan-400 focus:ring-[1px] focus:ring-cyan-400 focus:border-[1.5px] focus:rounded-0 indent-3 ${
									error ? "error:ring-rose-300 outline-rose-300" : ""
								}`}
								placeholder='Search Location'
								value={currentLocation}
							/>
						</div>
						<div className='flex items-center mt-16'>
							<label className='text-sm mr-4 opacity-70 whitespace-nowrap' htmlFor='starQty'>
								Star Quantity
							</label>
							<div className='flex flex-col w-full'>
								<input
									onChange={(e) => {
										setStarQty(e.target.value);
										timerRef.current = { ...timerRef?.current, slider: true };
									}}
									className='range-slider'
									type='range'
									id='starQty'
									name='starQty'
									min='0'
									max='30'
									step='1'
									defaultValue={starQty}
								/>
								<div className='flex text-xs items-center justify-between w-full -mb-[20px] pt-1'>
									<p className='opacity-60'>0</p>
									<p className='text-[12.5px] font-semibold -mb-0.5 text-sky-800 opacity-80'>{starQty}</p>
									<p className='opacity-60'>30</p>
								</div>
							</div>
						</div>
						<div className='flex items-center mt-16'>
							<div className='flex flex-col'>
								<label className='text-sm mr-4 opacity-70 whitespace-nowrap' htmlFor='starAltitude'>
									Star Altitude
								</label>
								<span className='text-xs opacity-60 mr-3 mt-[3px] whitespace-nowrap'>(Above horizon)</span>
							</div>
							<div className='flex flex-col w-full'>
								<input
									onChange={(e) => {
										setAltitudeAngle(e.target.value);
										timerRef.current = { ...timerRef?.current, slider: true };
									}}
									className='range-slider'
									type='range'
									id='starAltitude'
									name='starAltitude'
									min='0'
									max='90'
									step='1'
									defaultValue={altitudeAngle}
								/>
								<div className='flex text-xs items-center justify-between w-full -mb-[20px] pt-1'>
									<p className='opacity-60'>0</p>
									<p className='text-[12.5px] font-semibold -mb-0.5 text-sky-800 opacity-80'>{altitudeAngle}</p>
									<p className='opacity-60'>90</p>
								</div>
							</div>
						</div>
						<button id='submit' type='submit' className='invisible' />
					</form>
					<div className='w-full h-auto flex flex-col items-center justify-items-center align-middle'>
						<p className='opacity-70 mb-4 text-sm flex items-center self-start'>
							Currently Viewing Star
							<span className='text-lg font-semibold ml-3 -mt-0.5'>{hovering?.name ?? aladinSelected?.data?.name}</span>
						</p>
						<div ref={aladinEl} id='aladin-lite-div' className='h-[300px] w-[300px] sm:h-[370px] sm:w-[370px]' />
					</div>
				</div>
			</div>
			<div className='w-full md:w-7/12 flex justify-center md:justify-start'>
				<Globe
					ref={globeEl}
					globeImageUrl={
						time.getHours() > 17 || time.getHours() < 6
							? "//unpkg.com/three-globe/example/img/earth-night.jpg"
							: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
					}
					backgroundImageUrl='//unpkg.com/three-globe/example/img/night-sky.png'
					objectsData={objectsData}
					objectLabel='name'
					objectLat='lat'
					objectLng='lng'
					objectAltitude='alt'
					objectThreeObject={(d) => {
						const active = d.name === aladinSelected?.data?.name;
						return getStarObject3D(active);
					}}
					onObjectClick={(obj) => {
						const catalogEntries = aladinEl.current.view.catalogs[0].sources;
						const match = catalogEntries.find((entry) => entry.data.name === obj.name);

						if (match) setAladinSelected(match);
					}}
					onObjectHover={(object) => setHovering(object)}
					labelDotRadius={6}
					width={globeContainer.width}
					height={globeContainer.height}
					htmlElementsData={locationMarkers}
					htmlTransitionDuration={1500}
					htmlElement={(d) => {
						const el = document.createElement("div");
						el.innerHTML = threeDMarker;
						el.style.width = `${d.size}px`;
						el.style.marginLeft = `-4px`;
						el.style.marginTop = `-4px`;

						el.style["pointer-events"] = "auto";
						el.style.cursor = "pointer";
						return el;
					}}
				/>
			</div>
		</div>
	);
};

export default hot(App);

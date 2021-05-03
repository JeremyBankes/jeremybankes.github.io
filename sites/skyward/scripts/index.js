const LEAFLET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OPEN_SKY_API = 'https://opensky-network.org/api/states/all';
const CANADA_COORDINATES = [56.1304, -106.3468];
const REQUEST_INTERVAL = 30 * 1000;

function createMap() {
    const map = L.map('map').setView(CANADA_COORDINATES, 4);
    L.tileLayer(LEAFLET_URL, {}).addTo(map);
    return map;
}

async function getCanadianFlightData() {
    const allFlightData = await fetch(OPEN_SKY_API).then(response => response.json());
    const validatedFlightData = allFlightData.states.reduce((flights, flight) => {
        if (flight[2] !== 'Canada' || !flight[5] || !flight[6]) return flights;
        flights.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [flight[5], flight[6]]
            },
            properties: {
                callSign: flight[1].trim(),
                velocity: flight[9],
                trueTrack: flight[10]
            }
        });
        return flights;
    }, []);
    return { time: allFlightData.time, flights: validatedFlightData };
}

function finishLoading() {
    const mapOverlay = document.getElementById('mapOverlay');
    mapOverlay.style.visibility = 'hidden';
}

function displayError(error) {
    const mapOverlay = document.getElementById('mapOverlay');
    mapOverlay.style.visibility = 'visible';
    mapOverlay.firstElementChild.innerText = 'A fatal error has occured...';
    mapOverlay.lastElementChild.innerText = error;
}

function drawFlightData(map, flights) {
    flights.forEach(flight => {
        const latlng = [...flight.geometry.coordinates].reverse();
        if (!map.markers[flight.properties.callSign]) {
            map.markers[flight.properties.callSign] = L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'images/airplane-icon.png',
                    iconSize: [20, 20]
                })
            }).bindPopup('').addTo(map);
        }
        const marker = map.markers[flight.properties.callSign];
        marker.setRotationAngle(flight.properties.trueTrack);
        marker._popup.setContent(
            `<span>Flight: <b>${flight.properties.callSign}</b></span><br>` +
            `<span>Longitude: ${flight.geometry.coordinates[1]}</<span>` +
            `<span>Latitude: ${flight.geometry.coordinates[0]}</span><br>` +
            `<span>Speed: ${flight.properties.velocity}m/s</span>`
        );
    });
}

function animateFlightData(map, flightData) {
    if (!flightData) return;
    const secondsElapsed = (Date.now() / 1000) - flightData.time;
    flightData.flights.forEach(flight => {
        const marker = map.markers[flight.properties.callSign];
        if (marker) {
            const latlng = [...flight.geometry.coordinates].reverse();
            const velocityX = flight.properties.velocity * Math.sin(flight.properties.trueTrack * Math.PI / 180);
            const velocityY = flight.properties.velocity * Math.cos(flight.properties.trueTrack * Math.PI / 180);

            latlng[0] += velocityY * secondsElapsed / 111111;
            latlng[1] += velocityX * secondsElapsed / (111111 * Math.cos(latlng[0] * Math.PI / 180));

            marker.setLatLng(new L.LatLng(...latlng));
        }
    });
}

async function onLoad() {
    const map = createMap();
    map.markers = {};
    let requestTimestamp = 0;
    let flightData = null;

    const update = async () => {
        console.log('Making request. Waiting on response...');
        requestTimestamp = Date.now();
        flightData = await getCanadianFlightData();
        drawFlightData(map, flightData.flights);
        let requestDuration = Date.now() - requestTimestamp;
        let artificialDelay = REQUEST_INTERVAL - requestDuration;
        if (artificialDelay > 0) {
            console.log(`Received response with ${artificialDelay / 1000} seconds to spare. Adding delay before next request.`);
            setTimeout(update, artificialDelay);
        } else {
            console.log(`Response took too long for desired interval. Running ${-artificialDelay / 1000} seconds behind.`);
            console.log('Making another request immediately');
            setTimeout(update, 0);
        }
    };

    const overlay = document.getElementById('mapOverlay');
    const original = overlay.lastElementChild.innerText;
    setInterval(() => {
        if (overlay.style.visibility !== 'hidden') {
            const unix = Math.floor(Date.now() / 500);
            const ellipses = "...".substr(0, unix % 3 + 1);
            overlay.lastElementChild.innerText = original.replace(/\.+/, ellipses);
        } else {
            animateFlightData(map, flightData);
        }
    }, 100);

    try {
        await update();
        finishLoading();
    } catch (error) {
        displayError(error);
    }
}

addEventListener('load', onLoad);
const socket = io();

// Initialize the map object
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

const markers = {};

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("send-location", { latitude, longitude });
        updateMap(socket.id, latitude, longitude);
    }, 
    (error) => {
        console.error("Geolocation error:", error);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
} else {
    console.log("Geolocation is not supported by this browser.");
}

function updateMap(id, latitude, longitude) {
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
    markers[id].bindPopup(`User ${id}<br>Lat: ${latitude}<br>Lng: ${longitude}`).openPopup();
    map.setView([latitude, longitude], 16);
}

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    updateMap(id, latitude, longitude);
});

socket.on("user-disconnect", (id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
    }
})
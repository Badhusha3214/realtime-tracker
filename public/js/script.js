const socket = io();

// Initialize the map object
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

const markers = {};
const userSection = document.getElementById("user-section");

// Ask for user's name
let userName = prompt("Please enter your name:");
if (!userName) {
    userName = `User ${socket.id.substr(0, 4)}`;
}
socket.emit("user-name", userName);

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("send-location", { latitude, longitude });
        updateMap(socket.id, userName, latitude, longitude);
    }, 
    (error) => {
        console.error("Geolocation error:", error);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
} else {
    console.log("Geolocation is not supported by this browser.");
}


function updateMap(id, name, latitude, longitude) {
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
    markers[id].bindPopup(`${name}<br>Lat: ${latitude}<br>Lng: ${longitude}`).openPopup();
    map.setView([latitude, longitude], 16);
}

function updateUserSection() {
    userSection.innerHTML = "";
    for (const [id, user] of Object.entries(markers)) {
        const userDiv = document.createElement("div");
        userDiv.textContent = user.getPopup().getContent().split("<br>")[0];
        userSection.appendChild(userDiv);
    }
}

socket.on("receive-location", (data) => {
    const { id, name, latitude, longitude } = data;
    updateMap(id, name, latitude, longitude);
    updateUserSection();
});

socket.on("user-joined", (data) => {
    console.log(`${data.name} joined the session`);
});

socket.on("user-disconnected", (id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
        updateUserSection();
    }
});

socket.on("all-users", (users) => {
    users.forEach(user => {
        if (user.latitude && user.longitude) {
            updateMap(user.id, user.name, user.latitude, user.longitude);
        }
    });
    updateUserSection();
});
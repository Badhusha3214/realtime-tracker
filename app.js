// const express = require('express');
// const app = express();
// const path = require("path");
// const http = require("http");
// const socket = require('socket.io');

// const server = http.createServer(app);
// const io = socket(server);

// app.set("view engine", "ejs");

// // Serve static files from the 'public' directory
// app.use('/public', express.static(path.join(__dirname, "public")));

// io.on("connection", function (socket){
//     console.log("A user connected with ID:", socket.id);

//     socket.on("send-location", function(data){
//         // console.log("Received location from", socket.id, ":", data);
//         io.emit("receive-location", {id: socket.id, ...data});
//         socket.on("disconnect", function(){
//             io.emit("user-disconnected", socket.id)
//         })
//     });

//     socket.on("disconnect", function(){
//         console.log("User disconnected:", socket.id);
//     });
// });

// app.get("/", function(req, res){
//     res.render("index");
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require('express');
const app = express();
const path = require("path");
const http = require("http");
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("view engine", "ejs");

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, "public")));

// Store connected users
const connectedUsers = new Map();

io.on("connection", function (socket) {
  console.log("A user connected with ID:", socket.id);
  connectedUsers.set(socket.id, { id: socket.id });

  socket.on("send-location", function(data) {
    // Update user's location
    connectedUsers.set(socket.id, { ...connectedUsers.get(socket.id), ...data });
    
    // Emit updated location to all clients
    io.emit("receive-location", { id: socket.id, ...data });
  });

  socket.on("disconnect", function() {
    console.log("User disconnected:", socket.id);
    connectedUsers.delete(socket.id);
    io.emit("user-disconnected", socket.id);
  });

  // Send list of all connected users to the newly connected client
  socket.emit("all-users", Array.from(connectedUsers.values()));
});

app.get("/", function(req, res) {
  res.render("index");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
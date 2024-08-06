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

  socket.on("user-name", function(name) {
    connectedUsers.set(socket.id, { id: socket.id, name: name });
    io.emit("user-joined", { id: socket.id, name: name });
  });

  socket.on("send-location", function(data) {
    // Get the user from connectedUsers
    const user = connectedUsers.get(socket.id);
    
    // If user doesn't exist, create a new user object
    if (!user) {
      connectedUsers.set(socket.id, { id: socket.id, name: `User ${socket.id.substr(0, 4)}`, ...data });
    } else {
      // Update user's location
      connectedUsers.set(socket.id, { ...user, ...data });
    }
    
    // Emit updated location to all clients
    const updatedUser = connectedUsers.get(socket.id);
    io.emit("receive-location", { id: socket.id, name: updatedUser.name, ...data });
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
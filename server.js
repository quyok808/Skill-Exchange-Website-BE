const app = require("./src/app");
const connectDB = require("./src/configs/database");
require("dotenv").config(); // Load environment variables from .env
const port = process.env.PORT || 3000;

const http = require("http");
const socketIo = require("socket.io");

// Kết nối database
connectDB();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendRequest", (data) => {
    io.to(data.receiverId).emit("receiveRequest", data);
  });

  socket.on("acceptRequest", (data) => {
    io.to(data.senderId).emit("requestAccepted", data);
  });

  socket.on("disconnect", () => {
    console.log("⚡️ User disconnected:", socket.id);
  });
});

app.set("io", io);



// Khởi động server
app.listen(port, () => {
  console.log(`Server is running on http://${process.env.HOST}:${port}`);
});

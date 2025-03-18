const http = require("http");
// const socketIo = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/configs/database");
require("dotenv").config(); // Load environment variables from .env
const port = process.env.PORT || 3000;

// Kết nối database
connectDB();

const server = http.createServer(app);

// Import và khởi tạo socket.io
const { initializeSocket } = require("./src/configs/socket");
initializeSocket(server);

// Khởi động server
server.listen(port, () => {
  console.log(`Server is running on http://${process.env.HOST}:${port}`);
});

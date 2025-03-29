const https = require("https");
const fs = require("fs");
const os = require("os");
const app = require("./src/app");
const connectDB = require("./src/configs/database");
require("dotenv").config(); // Load environment variables từ .env

const port = process.env.PORT || 3000;

// Hàm kiểm tra và đọc chứng chỉ SSL
function loadSSLCertificates() {
  try {
    const key = fs.readFileSync("key.pem");
    const cert = fs.readFileSync("cert.pem");
    return { key, cert };
  } catch (error) {
    console.error("Lỗi khi đọc chứng chỉ SSL:", error.message);
    process.exit(1); // Thoát nếu không đọc được chứng chỉ
  }
}

const options = loadSSLCertificates();

// Hàm lấy IP cục bộ
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let interfaceName in interfaces) {
    for (let iface of interfaces[interfaceName]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address; // Trả về địa chỉ IPv4 của máy
      }
    }
  }
  return process.env.HOST || "0.0.0.0"; // Fallback về 0.0.0.0 nếu không tìm thấy
}

const host = getLocalIP(); // Lấy địa chỉ IP cục bộ

// Kết nối database
connectDB();

// Tạo server HTTPS
const server = https.createServer(options, app);

// Khởi tạo Socket.IO
const { initializeSocket } = require("./src/configs/socket");
initializeSocket(server);

// Khởi động server
server.listen(port, host, () => {
  console.log(`Server is running on https://${host}:${port}`);
});

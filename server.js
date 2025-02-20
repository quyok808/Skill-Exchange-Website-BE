const app = require("./src/app");
const connectDB = require("./src/config/database");
require("dotenv").config(); // Load environment variables from .env

const port = process.env.PORT || 3000;

// Kết nối database
connectDB();

// Khởi động server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});

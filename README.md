# Skill-Exchange-Website-BE

B1: npm install

B2: Paste file .env vào folder project

B3: Tải OpenSSL về và cài đặt

B4: Mở cmd lên và nhập
 `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -keyout key.pem -out cert.pem`

B5: Thay thế 2 file cert.pem và key.pem ở trong folder dự án bằng 2 file vừa mới được sinh ra

B6: npm start

// generate-excel-report.js
const fs = require("fs");
const ExcelJS = require("exceljs");
const path = require("path");

const jestOutputFile = "TestResults/test-results.json"; // File JSON output từ Jest
const excelOutputFile = "TestResults/test-report.xlsx"; // Tên file Excel muốn tạo

async function generateExcelReport() {
  console.log(`Reading Jest results from ${jestOutputFile}...`);

  try {
    // --- 1. Đọc và Parse file JSON kết quả Jest ---
    if (!fs.existsSync(jestOutputFile)) {
      console.error(`❌ Error: Jest output file not found: ${jestOutputFile}`);
      console.error(
        `➡️ Run "jest --json --outputFile=${jestOutputFile}" first.`
      );
      process.exit(1); // Thoát script nếu không có file JSON
    }
    const rawData = fs.readFileSync(jestOutputFile, "utf8");
    const results = JSON.parse(rawData);

    // --- 2. Chuẩn bị dữ liệu cho Excel ---
    const reportData = [];
    if (results.testResults) {
      results.testResults.forEach((suite) => {
        let suitePath = "<Unknown Test File>"; // Giá trị mặc định nếu không tìm thấy path
        if (
          suite &&
          typeof suite.testFilePath === "string" &&
          suite.testFilePath
        ) {
          try {
            // Chỉ gọi path.relative nếu testFilePath là string hợp lệ
            suitePath = path.relative(process.cwd(), suite.testFilePath);
          } catch (pathError) {
            console.warn(
              `⚠️ Could not determine relative path for: ${suite.testFilePath}`,
              pathError
            );
            suitePath = suite.testFilePath; // Dùng đường dẫn tuyệt đối nếu relative lỗi
          }
        } else if (suite && suite.name) {
          // Nếu không có path, thử dùng 'name' của suite làm định danh
          suitePath = suite.name || "<Suite without path or name>";
          console.warn(
            `⚠️ Test suite found without a valid testFilePath. Using name: "${suitePath}"`
          );
        } else {
          console.warn(
            `⚠️ Skipping a test suite entry because it lacks testFilePath and name.`
          );
          return; // Bỏ qua entry này nếu không có cả path và name
        }

        // Phần còn lại của vòng lặp assertionResults giữ nguyên
        if (suite.assertionResults) {
          suite.assertionResults.forEach((test) => {
            // ... (code xử lý 'test' giữ nguyên) ...
            // Cố gắng trích xuất Test Case ID từ tiêu đề test
            const tcMatch = test.title.match(/^(TC_\d+):/);
            const testCaseId = tcMatch ? tcMatch[1] : "N/A";
            const status = test.status; // 'passed', 'failed', 'pending'

            // Format thông báo kết quả/lỗi
            let resultMessage = "";
            if (status === "failed") {
              // Đảm bảo failureMessages là mảng trước khi join
              resultMessage = Array.isArray(test.failureMessages)
                ? test.failureMessages.join("\n")
                : "Failed (no message detail)";
            } else if (status === "passed") {
              resultMessage = "Passed";
            } else {
              resultMessage = "Pending / Skipped";
            }

            reportData.push({
              id: testCaseId,
              suite: suitePath, // Sử dụng biến suitePath đã được xử lý an toàn
              description: test.title || "<No Title>", // Thêm fallback cho title
              status: status,
              duration: test.duration
                ? (test.duration / 1000).toFixed(2) + "s"
                : "N/A", // Chuyển ms sang giây
              result: resultMessage
            });
          });
        } else {
          console.warn(`⚠️ Suite "${suitePath}" has no assertionResults.`);
        }
      });
    } else {
      console.warn("⚠️ No test results found in the JSON file.");
    }

    // --- 3. Tạo file Excel bằng exceljs ---
    console.log("Generating Excel report...");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Jest Reporter Script";
    workbook.lastModifiedBy = "Jest Reporter Script";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Test Execution Results");

    // Định nghĩa các cột (header và key phải khớp với thuộc tính trong reportData)
    worksheet.columns = [
      { header: "Test Case ID", key: "id", width: 15 },
      { header: "Test Suite (File)", key: "suite", width: 40 },
      { header: "Mô tả (Objective)", key: "description", width: 60 },
      { header: "Trạng thái", key: "status", width: 12 },
      {
        header: "Thời gian",
        key: "duration",
        width: 12,
        style: { alignment: { horizontal: "right" } }
      },
      { header: "Kết quả / Lỗi", key: "result", width: 70 }
    ];

    // Style cho header
    worksheet.getRow(1).font = {
      bold: true,
      name: "Calibri",
      size: 11,
      color: { argb: "FF000000" }
    };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" } // Màu xám nhạt
    };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true
    };

    // Thêm dữ liệu vào worksheet
    worksheet.addRows(reportData);

    // Style cho các dòng dữ liệu (ví dụ: màu chữ cho pass/fail, wrap text)
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
      if (rowNumber > 1) {
        // Bỏ qua dòng header
        const statusCell = row.getCell("status");
        const resultCell = row.getCell("result");

        // Wrap text cho các cột dài
        row.getCell("suite").alignment = { wrapText: true, vertical: "top" };
        row.getCell("description").alignment = {
          wrapText: true,
          vertical: "top"
        };
        resultCell.alignment = { wrapText: true, vertical: "top" };

        // Tô màu trạng thái và kết quả
        if (statusCell.value === "failed") {
          statusCell.font = { bold: true, color: { argb: "FFFF0000" } }; // Đỏ
          resultCell.font = { color: { argb: "FFFF0000" } }; // Đỏ
        } else if (statusCell.value === "passed") {
          statusCell.font = { color: { argb: "FF008000" } }; // Xanh lá
        } else {
          // Pending/Skipped
          statusCell.font = { italic: true, color: { argb: "FFA52A2A" } }; // Nâu + nghiêng
        }
      }
    });

    // Freeze hàng đầu tiên (header)
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // --- 4. Lưu file Excel ---
    await workbook.xlsx.writeFile(excelOutputFile);
    console.log(
      `✅ Excel report successfully generated: ${path.resolve(excelOutputFile)}`
    );
  } catch (error) {
    console.error("❌ Error generating Excel report:", error);
    process.exit(1); // Thoát với lỗi
  }
}

// Chạy hàm chính
generateExcelReport();

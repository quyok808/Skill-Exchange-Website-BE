const createReportHandler = require("../handlers/Reports/createReport.handler");
const reportModel = require("../models/report.model");
const AppError = require("../utils/appError");

jest.mock("../models/report.model", () => ({
  create: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createReportHandler Unit Tests", () => {
  // Test Case 1: Thiếu lý do (null)
  test("should throw AppError(400) if reason is null", async () => {
    const message = { userId: "user1", reportedBy: "user2", reason: null };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // Test Case 2: Lý do là chuỗi rỗng
  test("should throw AppError(400) if reason is an empty string", async () => {
    const message = { userId: "user1", reportedBy: "user2", reason: "" };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // Test Case 3: Người dùng tự báo cáo
  test("should throw AppError(400) if userId equals reportedBy", async () => {
    const message = { userId: "user1", reportedBy: "user1", reason: "Spam" };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Không thể tự báo cáo chính mình"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // Test Case 4: Báo cáo hợp lệ
  test("should create and return report on valid input", async () => {
    const message = {
      userId: "user2",
      reportedBy: "user1",
      reason: "Nội dung không phù hợp"
    };
    const mockCreatedReport = { _id: "mockReportId123", ...message };

    reportModel.create.mockResolvedValue(mockCreatedReport);

    const result = await createReportHandler(message);

    expect(result).toEqual(mockCreatedReport);
    expect(reportModel.create).toHaveBeenCalledTimes(1);
    expect(reportModel.create).toHaveBeenCalledWith(message);
  });

  // Test Case 5: Lỗi database
  test("should throw error if reportModel.create fails", async () => {
    const message = { userId: "user3", reportedBy: "user4", reason: "Vi phạm" };
    const mockDbError = new Error("Database connection failed");

    reportModel.create.mockRejectedValue(mockDbError);

    await expect(createReportHandler(message)).rejects.toThrow(
      "Database connection failed"
    );
    expect(reportModel.create).toHaveBeenCalledTimes(1);
    expect(reportModel.create).toHaveBeenCalledWith(message);
  });

  // Test Case 6: Thiếu userId
  test("should throw AppError(400) if userId is missing", async () => {
    const message = { reportedBy: "user2", reason: "Spam" };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("userId") // Tùy logic handler, có thể là "Missing userId"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // Test Case 7: Lý do chỉ chứa khoảng trắng (nên là lỗi)
  test("should throw AppError(400) if reason is only whitespace", async () => {
    const message = { userId: "user5", reportedBy: "user6", reason: "   " };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });
});

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
  test("TC_01: Để lý do báo cáo (reason) là chuỗi rỗng", async () => {
    const message = { userId: "1", reportedBy: "2", reason: "" };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  test("TC_02: Để lý do báo cáo (reason) là null", async () => {
    const message = { userId: "1", reportedBy: "2", reason: null };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // TC_03: Lỗi - Tự báo cáo (userId === reportedBy)
  test("TC_03: Tự báo cáo chính mình (userId === reportedBy)", async () => {
    const message = {
      userId: "1",
      reportedBy: "1",
      reason: "Spamming comments"
    };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Không thể tự báo cáo chính mình"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  test("TC_04: Lý do báo cáo (reason) không có và tự báo cáo chính mình", async () => {
    const message = { userId: "5", reportedBy: "5", reason: undefined };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  test("TC_05: Tạo mới bản report thất bại (reportModel.create thất bại)", async () => {
    const message = {
      userId: "2",
      reportedBy: "1",
      reason: "Fail this create"
    };
    const mockDbError = new Error("Database connection failed");

    reportModel.create.mockRejectedValue(mockDbError);

    await expect(createReportHandler(message)).rejects.toThrow(
      "Database connection failed"
    );
    expect(reportModel.create).toHaveBeenCalledTimes(1);
    expect(reportModel.create).toHaveBeenCalledWith(message);
  });

  test("TC_06: Tạo mới báo cáo thành công 1", async () => {
    const message = {
      userId: "10",
      reportedBy: "11",
      reason: "Valid content 1"
    };
    const mockCreatedReport = { _id: "reportId1", ...message };

    reportModel.create.mockResolvedValue(mockCreatedReport);

    const result = await createReportHandler(message);

    expect(result).toEqual(mockCreatedReport);
    expect(reportModel.create).toHaveBeenCalledTimes(1);
    expect(reportModel.create).toHaveBeenCalledWith(message);
  });

  test("TC_07: Tạo mới báo cáo thành công 2", async () => {
    const message = {
      userId: "99",
      reportedBy: "1",
      reason: "Valid content 2"
    };
    const mockCreatedReport = { _id: "reportId2", ...message };

    reportModel.create.mockResolvedValue(mockCreatedReport);

    const result = await createReportHandler(message);

    expect(result).toEqual(mockCreatedReport);
    expect(reportModel.create).toHaveBeenCalledTimes(1);
    expect(reportModel.create).toHaveBeenCalledWith(message);
  });

  // Test case mới để cover nhánh 5xx
  test("TC_08: Xử lý lỗi server khi tạo báo cáo", async () => {
    const message = {
      userId: "1",
      reportedBy: "2",
      reason: "Server error test"
    };

    // Mock một lỗi server với AppError có statusCode 500
    const mockServerError = new AppError(
      "Lỗi hệ thống, vui lòng thử lại sau",
      500
    );
    reportModel.create.mockRejectedValue(mockServerError);

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 500,
      message: "Lỗi hệ thống, vui lòng thử lại sau",
      status: "error" // Kiểm tra nhánh "error" trong ternary
    });
    expect(reportModel.create).toHaveBeenCalledTimes(1);
    expect(reportModel.create).toHaveBeenCalledWith(message);
  });
});

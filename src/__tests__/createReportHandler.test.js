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
  // TC_01: Lỗi - message.reason là chuỗi rỗng ("")
  test("TC_01: should throw AppError(400) if reason is an empty string", async () => {
    const message = { userId: "1", reportedBy: "2", reason: "" };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // TC_02: Lỗi - message.reason là null
  test("TC_02: should throw AppError(400) if reason is null", async () => {
    const message = { userId: "1", reportedBy: "2", reason: null };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // TC_03: Lỗi - Tự báo cáo (userId === reportedBy)
  test("TC_03: should throw AppError(400) if userId equals reportedBy", async () => {
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

  // TC_04: Lỗi - Thiếu reason VÀ Tự báo cáo (Ưu tiên lỗi reason)
  test("TC_04: should throw AppError(400) for missing reason even if userId equals reportedBy", async () => {
    const message = { userId: "5", reportedBy: "5", reason: undefined };

    await expect(createReportHandler(message)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vui lòng nhập lý do báo cáo!"
    });
    expect(reportModel.create).not.toHaveBeenCalled();
  });

  // TC_05: Lỗi - Thực thi (reportModel.create thất bại)
  test("TC_05: should throw error if reportModel.create fails", async () => {
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

  // TC_06: Thành công (Trường hợp 1)
  test("TC_06: should create and return report on valid input (case 1)", async () => {
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

  // TC_07: Thành công (Trường hợp 2 - dữ liệu khác)
  test("TC_07: should create and return report on valid input (case 2)", async () => {
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
});

const mongoose = require("mongoose");
const ChatRoom = require("../models/chat.model");
const Message = require("../models/message.model");
const fs = require("fs");
const path = require("path");
// Mock catchAsync để gọi trực tiếp hàm bên trong
jest.mock("../utils/catchAsync", () => (fn) => fn);

const chatController = require("../controllers/chat.controller"); // File chat.controller.js

jest.mock("fs"); // Mock module fs
jest.mock("../models/chat.model"); // Mock ChatRoom model
jest.mock("../models/message.model"); // Mock Message model

describe("Chat Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test cho sendMessage
  describe("sendMessage", () => {
    it("should send a message successfully without file or image", async () => {
      const chatRoomId = new mongoose.Types.ObjectId().toString();
      const senderId = new mongoose.Types.ObjectId().toString();

      const req = {
        body: { chatRoomId, content: "Hello World" },
        user: { id: senderId },
        files: {},
        app: {
          get: jest.fn().mockReturnValue({
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
          })
        }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue({ _id: chatRoomId });
      Message.create.mockResolvedValue({
        _id: "messageId",
        chatRoom: chatRoomId,
        sender: senderId,
        content: "Hello World"
      });
      Message.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "messageId",
          chatRoom: chatRoomId,
          sender: { name: "Test User", email: "test@example.com" },
          content: "Hello World"
        })
      });

      await chatController.sendMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: { message: expect.objectContaining({ content: "Hello World" }) }
      });
      expect(req.app.get("io").to).toHaveBeenCalledWith(chatRoomId);
      expect(req.app.get("io").emit).toHaveBeenCalledWith(
        "receiveMessage",
        expect.any(Object)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should send a message with an image", async () => {
      const chatRoomId = new mongoose.Types.ObjectId().toString();
      const senderId = new mongoose.Types.ObjectId().toString();

      fs.readFileSync.mockReturnValue(Buffer.from("fake image content"));

      const req = {
        body: { chatRoomId, content: "Image message" },
        user: { id: senderId },
        files: { image: [{ filename: "test.png" }] },
        app: {
          get: jest.fn().mockReturnValue({
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
          })
        }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue({ _id: chatRoomId });
      Message.create.mockResolvedValue({
        _id: "messageId",
        chatRoom: chatRoomId,
        sender: senderId,
        content: "Image message",
        image: "test.png"
      });
      Message.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "messageId",
          chatRoom: chatRoomId,
          sender: { name: "Test User", email: "test@example.com" },
          content: "Image message",
          image: "test.png"
        })
      });

      await chatController.sendMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: {
          message: expect.objectContaining({
            image: expect.stringContaining("data:image/png;base64")
          })
        }
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test.png")
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if chat room does not exist", async () => {
      const req = {
        body: {
          chatRoomId: new mongoose.Types.ObjectId().toString(),
          content: "This should fail"
        },
        user: { id: new mongoose.Types.ObjectId().toString() },
        files: {},
        app: { get: jest.fn() }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue(null);

      await chatController.sendMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Phòng chat không tồn tại!",
          statusCode: 404
        })
      );
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // Test cho getMessages
  describe("getMessages", () => {
    it("should get messages successfully", async () => {
      const chatRoomId = new mongoose.Types.ObjectId().toString();

      const req = { params: { chatRoomId } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue({ _id: chatRoomId });
      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            _id: "msg1",
            chatRoom: chatRoomId,
            sender: { name: "User1" },
            content: "Msg 1"
          },
          {
            _id: "msg2",
            chatRoom: chatRoomId,
            sender: { name: "User1" },
            content: "Msg 2"
          }
        ])
      });

      await chatController.getMessages(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: {
          messages: expect.arrayContaining([
            expect.objectContaining({ content: "Msg 1" })
          ])
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should send a message with both image and file", async () => {
      const chatRoomId = new mongoose.Types.ObjectId().toString();
      const senderId = new mongoose.Types.ObjectId().toString();

      // Mock fs.readFileSync để trả về dữ liệu giả lập cho cả image và file
      fs.readFileSync.mockReturnValue(Buffer.from("fake content"));

      const req = {
        body: { chatRoomId, content: "Message with image and file" },
        user: { id: senderId },
        files: {
          image: [{ filename: "test.png" }], // Giả lập upload hình ảnh
          file: [{ filename: "test.pdf" }] // Giả lập upload tệp
        },
        app: {
          get: jest
            .fn()
            .mockReturnValue({
              to: jest.fn().mockReturnThis(),
              emit: jest.fn()
            })
        }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      // Mock ChatRoom và Message
      ChatRoom.findById.mockResolvedValue({ _id: chatRoomId });
      Message.create.mockResolvedValue({
        _id: "messageId",
        chatRoom: chatRoomId,
        sender: senderId,
        content: "Message with image and file",
        image: "test.png",
        file: "test.pdf"
      });
      Message.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "messageId",
          chatRoom: chatRoomId,
          sender: { name: "Test User", email: "test@example.com" },
          content: "Message with image and file",
          image: "test.png",
          file: "test.pdf"
        })
      });

      await chatController.sendMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: {
          message: expect.objectContaining({
            content: "Message with image and file",
            image: expect.stringContaining("data:image/png;base64"),
            file: expect.stringContaining("data:application/pdf;base64")
          })
        }
      });
      expect(fs.readFileSync).toHaveBeenCalledTimes(2); // Gọi 2 lần: 1 cho image, 1 cho file
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test.png")
      );
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test.pdf")
      );
      expect(req.app.get("io").to).toHaveBeenCalledWith(chatRoomId);
      expect(req.app.get("io").emit).toHaveBeenCalledWith(
        "receiveMessage",
        expect.any(Object)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if chat room does not exist", async () => {
      const req = {
        params: { chatRoomId: new mongoose.Types.ObjectId().toString() }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue(null);

      await chatController.getMessages(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Phòng chat không tồn tại!",
          statusCode: 404
        })
      );
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // Test cho getChatRoom
  describe("getChatRoom", () => {
    it("should get chat room successfully", async () => {
      const chatRoomId = new mongoose.Types.ObjectId().toString();

      const req = { params: { chatRoomId } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue({
        _id: chatRoomId,
        name: "Test Room"
      });

      await chatController.getChatRoom(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: { chatRoom: expect.objectContaining({ name: "Test Room" }) }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if chat room does not exist", async () => {
      const req = {
        params: { chatRoomId: new mongoose.Types.ObjectId().toString() }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      ChatRoom.findById.mockResolvedValue(null);

      await chatController.getChatRoom(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Phòng chat không tồn tại!",
          statusCode: 404
        })
      );
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});

const ChatRoom = require("../models/chat.model");
const cron = require("node-cron");
const Connection = require("../models/connections.model")

//Gửi yêu cầu kết nối
exports.sendRequest = async(req, res)=>{
    try{
        const{receiverId, skill}= req.body;
        const senderId = req.user.id;

        if(senderId === receiverId){
            return res.status(400).json({ message: "Không thể kết nối với chính mình!" });
        }

        const existingRequest = await Connection.findOne({
            $or: [
                { senderId, receiverId},
                {senderId: receiverId,  receiverId: senderId }                
            ]
        });

        if(existingRequest){
            return res.status(400).json({message:"Bạn đã có kết nối"});
        }
        const newConnection = new Connection({senderId, receiverId, skill,status: "pending" });
        await newConnection.save();
        res.status(201).json({ message: "Yêu cầu kết nối đã được gửi!" });
    }catch(error){
        res.status(500).json({ message: "Lỗi server", error });
    }
};

//chấp nhận yêu cầu
exports.acceptRequest = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.id);
        if (!connection) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu!" });
        }
    
        if (connection.receiverId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Không có quyền xử lý yêu cầu này!" });
        }

        if (connection.status === "accepted") {
            return res.status(400).json({ message: "Kết nối này đã được chấp nhận trước đó!" });
        }

        // Tạo phòng chat
        const chatRoom = new ChatRoom({
            participants: [connection.senderId, connection.receiverId]
        });
        await chatRoom.save();

        // Cập nhật Connection với chatRoomId
        connection.status = "accepted";
        connection.chatRoomId = chatRoom._id;
        await connection.save();

        res.json({ message: "Yêu cầu kết nối đã được chấp nhận!", data: {chatRoom} });
        } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
        }
    };

//hủy kết nối
exports.disconnect = async(req,res) => {
    try{
        const{userId} = req.body;
        const currentUserId = req.user.id;
        const connection = await Connection.findOne({
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ],
            status: "accepted"  // Chỉ hủy nếu đã kết nối
        });

        if (!connection) {
            return res.status(404).json({ message: "Không tìm thấy kết nối!" });
        }

        await ChatRoom.findByIdAndDelete(connection.chatRoomId);

        await Connection.findByIdAndDelete(connection._id);

        res.json({ message: "Kết nối đã bị hủy!" });
    }catch(error){
        res.status(500).json({ message: "Lỗi server", error });
    }
}

//từ chối yêu cầu
exports.rejectRequest = async (req, res) =>{
    try {
        const connection = await Connection.findById(req.params.id);
        if(!Connection){
            return res.status(400).json({message: "Không có yêu cầu  kết nối"});
        }

        if (connection.receiverId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Không có quyền xử lý yêu cầu này!" });
        }

        connection.status = "rejected";
        connection.rejectedAt = new Date();
        await connection.save();

        res.json({ message: "Yêu cầu kết nối bị từ chối! Sẽ tự động xóa sau 24h." });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};

cron.schedule("0 * * * *", async () => {
    console.log("🔄 Kiểm tra và xóa yêu cầu từ chối quá 24h...");
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
        const result = await Connection.deleteMany({ 
            status: "rejected", 
            rejectedAt: { $lte: twentyFourHoursAgo } 
        });
        console.log(`✅ Đã xóa ${result.deletedCount} yêu cầu kết nối bị từ chối quá 24h.`);
    } catch (error) {
        console.error("❌ Lỗi khi xóa yêu cầu từ chối quá 24h:", error);
    }
});

// Lấy danh sách yêu cầu kết nối đang chờ xử lý
exports.getPendingrequests = async(req,res)=>{
    try {
        const pendingRequests = await Connection.find({
            $or: [
                {receiverId: req.user.id},
                {senderId: req.user.id}
            ]
        }).populate("senderId", "name email").populate("receiverId", "name email" );
        res.json(pendingRequests);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};


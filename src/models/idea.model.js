const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
  {
    caption: { type: String, require: true },
    description: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, //Kiểu dữ liệu ObjectId (Tham chiếu đến một document khác trong mongodb)
      ref: "User", //Tham chiếu đến model User
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ideas", ideaSchema);

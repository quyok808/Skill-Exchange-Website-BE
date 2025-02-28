const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    category: {
      type: String,
      enum: ["Frontend", "Backend", "Mobile", "Database", "DevOps", "Other"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", SkillSchema);

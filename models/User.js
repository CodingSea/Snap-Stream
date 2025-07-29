const mongoose = require("mongoose");

const userSchema = new mongoose.Schema
(
    {
        email: { type: String, required: true, unique: [true, "email must be unique"] },
        username : { type: String, required: true },
        password: { type: String, required: true },
        following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        followers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        profileImage: String,
        role: {type:String, enum: ["user", "admin"], default: "user"}
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
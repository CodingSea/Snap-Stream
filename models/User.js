const mongoose = require("mongoose");

const userSchema = new mongoose.Schema
(
    {
        email: { type: String, required: true },
        username : { type: String, required: true },
        password: { type: String, required: true },
        following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        followers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
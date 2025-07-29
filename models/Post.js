const mongoose = require("mongoose");

const postSchema = new mongoose.Schema
(
    {
        image: {type: String, required: true},
        content: String,
        comments: [String],
        user: {type: mongoose.Types.ObjectId, ref: "User"}
    }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
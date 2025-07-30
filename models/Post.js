const mongoose = require("mongoose");
//const Comment = require("./Comment");

const commentSchema = new mongoose.Schema
(
    {
        user: {type: mongoose.Types.ObjectId, ref: "User"},
        content: {type: String}
    }
);

const postSchema = new mongoose.Schema
(
    {
        image: {type: String, required: true},
        content: String,
        comments: [commentSchema],
        user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
    }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
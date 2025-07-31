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
        imageId: String,
        content: String,
        comments: [commentSchema],
        user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        tags: [String]
    }
    , {timestamps: true}
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
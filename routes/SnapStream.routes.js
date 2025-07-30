const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

router.get("/profile", async (req, res) =>
{
    try
    {
        if(!req.session.isLoggedIn)
        {
            return res.redirect("/");
        }

        const foundUser = await User.findById(req.session.userId);
        const allPosts = await Post.find({user: req.session.userId});

        res.render("SnapStream/profile.ejs", {foundUser, allPosts});
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/new", (req, res) =>
{
    res.render("SnapStream/new.ejs");
});

router.post("/new", async (req, res) =>
{
    try
    {
        const post = 
        {
            image: req.body.image,
            content: req.body.content,
            comments: [],
            user: req.session.user._id
        }

        await Post.create(post);
        // the go to last page is taken from the internet
        req.session.history.pop();
        const previousPage = req.session.history[req.session.history.length - 1];
        res.redirect(previousPage);
        
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/search", async (req, res) =>
{
    try
    {
        const allPosts = await Post.find();
        res.render("SnapStream/search.ejs", {foundUser: req.session.user, allPosts});
    }
    catch(error)
    {
        console.log(error);
    }
});

router.delete("/:id", async (req, res) => 
{
    try
    {
        await Post.findByIdAndDelete(req.params.id);
        res.redirect("/snap-stream/profile");
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/:id", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id).populate("user").populate("comments.user");
        const isUserPost = foundPost.user._id == req.session.user._id;
        res.render("SnapStream/post-details.ejs", {foundPost, isUserPost});
    }
    catch(error)
    {
        console.log(error);
    }
});

router.put("/:id", async (req, res) => 
{
    try
    {
        const updatedPost = await Post.findById(req.params.id);
        const comment = 
        {
            user: req.session.user.id,
            content: req.body.content
        }
        updatedPost.comments.push(comment);
        res.redirect("/snap-stream/profile");
    }
    catch(error)
    {
        console.log(error);
    }
});

/*
router.delete("/profile/:id", async (req, res) => 
{
    try
    {
        await Post.findByIdAndDelete(req.params.id).populate("Comment");
        res.redirect("/snap-stream/profile");
    }
    catch(error)
    {
        console.log(error);
    }
});*/

router.post("/:id/comment", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id);
        const comment = 
        {
            user: req.session.userId,
            content: req.body.content
        }
        console.log(comment)
        foundPost.comments.push(comment);
        foundPost.save();
        res.redirect("/snap-stream/" + req.params.id);
    }
    catch(error)
    {
        console.log(error);
    }
});

module.exports = router;
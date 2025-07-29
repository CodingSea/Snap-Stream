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

router.delete("/profile/:id", async (req, res) => 
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

router.get("/profile/:id", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id);
        res.render("SnapStream/edit.ejs", {foundPost});
    }
    catch(error)
    {
        console.log(error);
    }
});

router.put("/profile/:id", async (req, res) => 
{
    try
    {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body);
        res.redirect("/snap-stream/profile");
    }
    catch(error)
    {
        console.log(error);
    }
});

router.delete("/profile/:id", async (req, res) => 
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


module.exports = router;
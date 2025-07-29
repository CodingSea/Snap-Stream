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

        res.render("SnapStream/profile.ejs", {foundUser});
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

module.exports = router;
const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const isSignedIn = require("../middleware/isSignedIn");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");

const storage = multer.memoryStorage
    ({
        destination: (req, file, cb) =>
        {
            cb(null, './public/images/');
        },
        filename: (req, file, cb) =>
        {
            cb(null, file.originalname);
        }
    });
const upload = multer({ storage });

async function handleUpload(file)
{
    const res = await cloudinary.uploader.upload(file, 
    {
        resource_type: "auto",
    });
    return res;
}

let lastPage;

router.get("/profile", isSignedIn, async (req, res) =>
{
    try
    {
        if (!req.session.isLoggedIn)
        {
            return res.redirect("/");
        }

        const foundUser = await User.findById(req.session.userId);
        const allPosts = await Post.find({ user: req.session.userId });

        lastPage = "/snap-stream/profile";
        res.render("SnapStream/profile.ejs", { foundUser, allPosts });
    }
    catch (error)
    {
        console.log(error);
    }
});

router.get("/new", isSignedIn, (req, res) =>
{
    res.render("SnapStream/new.ejs");
});

router.post("/new", upload.single("image"), async (req, res) =>
{
    try
    {
        console.log(req.file);

        // 
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const cldRes = await handleUpload(dataURI);
        console.log(cldRes);
        
        const post =
        {
            image: cldRes.secure_url,
            content: req.body.content,
            comments: [],
            user: req.session.user._id
        }
        await Post.create(post),
        // the go to last page is taken from the internet
        req.session.history.pop();
        const previousPage = req.session.history[req.session.history.length - 1];
        lastPage = "/snap-stream/new";
        res.redirect(previousPage);

    }
    catch (error)
    {
        console.log(error);
    }
});

router.get("/search", async (req, res) =>
{
    try
    {
        const allPosts = await Post.find();
        lastPage = "/snap-stream/search";
        res.render("SnapStream/search.ejs", { foundUser: req.session.user, allPosts });
    }
    catch (error)
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
    catch (error)
    {
        console.log(error);
    }
});

router.get("/:id", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id).populate("user").populate("comments.user");
        let isUserPost = false;
        if (req.session.user)
        {
            isUserPost = foundPost.user._id == req.session.user._id;
        }
        const isLiked = foundPost.likes.includes(req.session.userId);
        res.render("SnapStream/edit.ejs", { foundPost, isUserPost, isLiked });
    }
    catch (error)
    {
        console.log(error);
    }
});

router.put("/:id/edit", async (req, res) => 
{
    try
    {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body);
        res.redirect("/snap-stream/" + req.params.id);
    }
    catch (error)
    {
        console.log(error);
    }
});

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
        foundPost.comments.push(comment);
        await foundPost.save();
        res.redirect("/snap-stream/" + req.params.id);
    }
    catch (error)
    {
        console.log(error);
    }
});

router.post("/:id/like", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id);

        if (foundPost.likes.includes(req.session.userId))
        {
            foundPost.likes.pop(req.session.userId);
            foundPost.save();
        }
        else
        {
            foundPost.likes.push(req.session.userId);
            foundPost.save();
        }

        res.redirect("/snap-stream/" + req.params.id);
    }
    catch (error)
    {
        console.log(error);
    }
});

router.post("/back", (req, res) =>
{
    res.redirect(lastPage);
});

module.exports = router;
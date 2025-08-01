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

router.get("/profile/:id", isSignedIn, async (req, res) =>
{
    try
    {
        if (!req.session.isLoggedIn)
        {
            return res.redirect("/");
        }

        const currentUser = await User.findById(req.session.user._id);
        const foundUser = await User.findById(req.params.id);
        let allPosts = await Post.find();

        const userInfo = 
        {
            posts: allPosts.filter(x => x.user == req.session.user._id).length,
            following: currentUser.following.length,
            followers: currentUser.followers.length

        }
        
        allPosts = allPosts.filter(x => x.user == req.params.id);

        lastPage = "/snap-stream/profile/" + req.params.id;
        res.render("SnapStream/profile.ejs", { foundUser, allPosts, currentUser, userInfo });
    }
    catch (error)
    {
        console.log(error);
    }
});

router.get("/profile", isSignedIn, (req, res) =>
{
    res.redirect("/snap-stream/profile/" + req.session.user._id);
});

router.post("/profile/:id/followBtn", async (req, res) =>
{
    try
    {
        const foundUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.session.user._id);
        if(currentUser.following.includes(foundUser._id))
        {
            currentUser.following.pop(foundUser._id);
            currentUser.save();
            foundUser.followers.pop(currentUser._id);
            foundUser.save();
        }
        else
        {
            currentUser.following.push(foundUser._id);
            currentUser.save();
            foundUser.followers.push(currentUser._id);
            foundUser.save();
        }

        console.log("called");

        res.redirect("/snap-stream/profile/" + req.params.id)
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/new", isSignedIn, async (req, res) =>
{
    try
    {
        const currentUser = await User.findById(req.session.user._id);;
        let allPosts = await Post.find();

        const userInfo = 
        {
            posts: allPosts.filter(x => x.user == req.session.user._id).length,
            following: currentUser.following.length,
            followers: currentUser.followers.length

        }

        res.render("SnapStream/new.ejs", {currentUser, userInfo});
    }
    catch(error)
    {
        console.log(error);
    }
});

router.post("/new", upload.single("image"), async (req, res) =>
{
    try
    {
        // taken from the internet
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const cldRes = await handleUpload(dataURI);

        const tagsEntries = Object.entries(req.body).filter(([key, value]) =>
            key.includes("tag_")
        );

        const tags = tagsEntries.map(([, value]) => value);
        
        const post =
        {
            image: cldRes.secure_url,
            imageId: cldRes.public_id,
            content: req.body.content,
            comments: [],
            user: req.session.user._id,
            tags: tags
        }

        

        await Post.create(post),
        // the go to last page is taken from the internet
        req.session.history.pop();
        const previousPage = req.session.history[req.session.history.length - 1];
        res.redirect("/snap-stream/profile/" + req.session.user._id);

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
        let currentUser;
        let userInfo;
        if(req.session.user)
        {
            currentUser = await User.findById(req.session.user._id);
            userInfo = 
            {
                posts: allPosts.filter(x => x.user == req.session.user._id).length,
                following: currentUser.following.length,
                followers: currentUser.followers.length

            }
        }
        lastPage = "/snap-stream/search";
        res.render("SnapStream/search.ejs", { foundUser: req.session.user, allPosts, currentUser, userInfo });
    }
    catch (error)
    {
        console.log(error);
    }
});

router.get("/settings", isSignedIn, async (req, res) => 
{
    res.redirect("/snap-stream/" + req.session.user._id + "/settings")
});

router.get("/:id/settings", isSignedIn, async (req, res) => 
{
    try
    {
        const foundUser = await User.findById(req.params.id);
        const currentUser = foundUser;
        let allPosts = await Post.find();

        const userInfo = 
        {
            posts: allPosts.filter(x => x.user == req.session.user._id).length,
            following: currentUser.following.length,
            followers: currentUser.followers.length

        }

        res.render("SnapStream/settings.ejs", { foundUser, currentUser, userInfo });
    }
    catch(error)
    {
        console.log(error);
    }
});

router.post("/:id/settings/profile-image", upload.single("profileImage"), async (req, res) => 
{
    try
    {
        const foundUser = await User.findById(req.params.id);

        if(foundUser.profileImage)
        {
            cloudinary.uploader.destroy(foundUser.profileImageId, function(error, result)
            {
                console.log(result, error);
            });
        }

        // taken from the internet
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const cldRes = await handleUpload(dataURI);

        foundUser.profileImage = cldRes.secure_url;
        foundUser.profileImageId = cldRes.public_id;
        foundUser.save();

        res.redirect("/snap-stream/settings");
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/home", isSignedIn, (req, res) => 
{
    res.redirect("/snap-stream/" + req.session.user._id + "/home")
});

router.get("/:id/home", isSignedIn, async (req, res) => 
{
    try
    {
        const allPosts = await Post.find().populate("user");
        const currentUser = await User.findById(req.session.user._id).populate("following");
        
        const userInfo = 
        {
            posts: allPosts.filter(x => x.user._id == req.params.id).length,
            following: currentUser.following.length,
            followers: currentUser.followers.length
        }

        let posts = [];

        currentUser.following.forEach((u) => 
        {
            allPosts.forEach((post) => 
            {
                
                console.log("post: " + u._id);
                console.log("post: " + post.user._id);
                
                if(JSON.stringify(u._id) === JSON.stringify(post.user._id))
                {
                    posts.push(post);
                    console.log("in if");
                }
            });
        })

        res.render("SnapStream/homepage.ejs", { posts, allPosts, currentUser, userInfo });
    }
    catch(error)
    {
        console.log(error);
    }
});

router.post("/back", (req, res) =>
{
    if(lastPage == undefined)
    {
        res.redirect("/");
    }
    else
    { 
        res.redirect(lastPage);
    }
});

router.delete("/:id", async (req, res) => 
{
    try
    {
        const foundPost = await Post.findById(req.params.id);
        cloudinary.uploader.destroy(foundPost.imageId);
        await Post.deleteOne(foundPost._id);
        res.redirect("/snap-stream/profile/" + req.session.user._id);
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
        const allPosts = await Post.find();
        let isUserPost = false;
        let isUser = false;
        let currentUser;
        let userInfo;
        let isLiked;
        if (req.session.user)
        {
            isUserPost = foundPost.user._id == req.session.user._id;
            isUser = true;

            currentUser = await User.findById(req.session.user._id);
            userInfo = 
            {
                posts: allPosts.filter(x => x.user._id == req.params.id).length,
                following: currentUser.following.length,
                followers: currentUser.followers.length
            }

            isLiked = foundPost.likes.includes(req.session.userId);
        }
        res.render("SnapStream/post-details.ejs", { foundPost, isUserPost, isUser, isLiked, currentUser, userInfo });
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

module.exports = router;
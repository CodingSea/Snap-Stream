const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const isSignedIn = require("../middleware/isSignedIn");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");
let pageType = "profile";

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

router.get("/profile/:id", async (req, res) =>
{
    try
    {
        if (!req.session.user)
        {
            return res.redirect("/");
        }
        

        const currentUser = await User.findById(req.session.user._id);
        const foundUser = await User.findById(req.params.id);
        let allPosts = await Post.find({user: req.params.id}).sort({createdAt: -1});
        let isFollowed = false;

        const userInfo = 
        {
            posts: await Post.countDocuments({user: req.session.user._id}),
            following: currentUser.following.length,
            followers: currentUser.followers.length

        }

        if(currentUser.following.includes(foundUser._id))
        {
            isFollowed = true;
        }

        lastPage = "/snap-stream/profile/" + req.params.id;
        res.render("SnapStream/profile.ejs", { foundUser, allPosts, currentUser, userInfo, isFollowed });
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
            currentUser.following.splice(currentUser.following.indexOf(foundUser._id), 1);
            await currentUser.save();
            foundUser.followers.splice(foundUser.followers.indexOf(currentUser._id), 1);
            await foundUser.save();
        }
        else
        {
            currentUser.following.push(foundUser._id);
            await currentUser.save();
            foundUser.followers.push(currentUser._id);
            await foundUser.save();
        }

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
        const currentUser = await User.findById(req.session.user._id);

        const userInfo = 
        {
            posts: await Post.countDocuments({user: req.session.user._id}),
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
        const allPosts = await Post.find().sort({createdAt: -1});
        const allUsers = await User.find();
        let currentUser;
        let userInfo;
        let showPosts = true;
        if(req.session.user)
        {
            currentUser = await User.findById(req.session.user._id);
            userInfo = 
            {
                posts: await Post.countDocuments({user: req.session.user._id}),
                following: currentUser.following.length,
                followers: currentUser.followers.length

            }
        }
                if(!req.query.search){ req.query.search=null}

        lastPage = "/snap-stream/search";
        res.render("SnapStream/search.ejs", { foundUser: req.session.user, allPosts, currentUser, userInfo, allUsers, showPosts,query:req.query.search  });
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

        const userInfo = 
        {
            posts: await Post.countDocuments({user: req.session.user._id}),
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

router.post("/:id/settings/profile", upload.single("profileImage"), async (req, res) => 
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
  
        if(req.body.profileImage)
        {
            // taken from the internet
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const cldRes = await handleUpload(dataURI);

            foundUser.profileImage = cldRes.secure_url;
            foundUser.profileImageId = cldRes.public_id;
        }
        
        foundUser.username = req.body.username;
        await foundUser.save();

        res.redirect("/snap-stream/settings");
    }
    catch(error)
    {
        console.log(error);
    }
});

router.delete("/:id/settings/profile", async (req, res) =>
{
    try
    {
        const foundUser = await User.findById(req.session.user._id).populate("following").populate("followers");

        foundUser.following.forEach( async (u) =>
        {
            const fUser = await User.findById(u._id);
            fUser.followers.splice(fUser.followers.indexOf(foundUser._id, 1));
            fUser.save();
        });
        foundUser.followers.forEach( async (u) =>
        {
            const fUser = await User.findById(u._id);
            fUser.following.splice(fUser.following.indexOf(foundUser._id, 1))
            fUser.save();
        });

        const allUserPosts = await Post.find({user: req.session.user._id});
        allUserPosts.forEach((foundPost) => 
        {
            if(JSON.stringify(foundPost.user._id) != JSON.stringify(req.session.user._id)) { return res.redirect("/"); }
            cloudinary.uploader.destroy(foundPost.imageId);
        });

        await Post.deleteMany({ user: req.session.user._id });

        await User.findByIdAndDelete(req.session.user._id);

        req.session.destroy();

        res.redirect("/");
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/home", isSignedIn, (req, res) => 
{
    res.redirect("/snap-stream/home/" + req.session.user._id )
});

router.get("/home/:id", isSignedIn, async (req, res) => 
{
    try
    {
        const currentUser = await User.findById(req.session.user._id).populate("following");
        const allPosts = await Post.find({user: {$in: currentUser.following}}).populate("user").sort({createdAt: -1});
        
        const userInfo = 
        {
            posts: await Post.countDocuments({user: req.session.user._id}),
            following: currentUser.following.length,
            followers: currentUser.followers.length
        }

        lastPage = "/snap-stream/home/" + req.params.id;
        res.render("SnapStream/homepage.ejs", { allPosts, currentUser, userInfo });
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

router.get("/:id/profile", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id).populate("user").populate("comments.user");
        let allPosts = await Post.find({ user: req.session.user._id }).sort({createdAt: -1}).populate("user");
        let isUserPost = false;
        let isUser = false;
        let currentUser;
        let userInfo;
        let isLiked;
        pageType = "profile";
        if (req.session.user)
        {
            isUserPost = foundPost.user._id == req.session.user._id;
            isUser = true;

            currentUser = await User.findById(req.session.user._id);
            userInfo = 
            {
                posts: await Post.countDocuments({user: req.session.user._id}),
                following: currentUser.following.length,
                followers: currentUser.followers.length
            }
            isLiked = foundPost.likes.includes(req.session.user._id);
            if(!req.query.q)
            {
                req.query.q = null;
            }
        }
        res.render("SnapStream/post-details.ejs", { foundPost, isUserPost, isUser, isLiked, currentUser, userInfo, allPosts, pageType, query:req.query.q });
    }
    catch (error)
    {
        console.log(error);
    }
});

router.get("/:id/search", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id).populate("user").populate("comments.user");
        let allPosts = await Post.find().sort({createdAt: -1}).populate("user");
        let allUsers = await User.find();
        let isUserPost = false;
        let isUser = false;
        let currentUser;
        let userInfo;
        let isLiked;
        pageType = "search";
        if (req.session.user)
        {
            isUserPost = foundPost.user._id == req.session.user._id;
            isUser = true;

            currentUser = await User.findById(req.session.user._id);
            userInfo = 
            {
                posts: await Post.countDocuments({user: req.session.user._id}),
                following: currentUser.following.length,
                followers: currentUser.followers.length
            }
            isLiked = foundPost.likes.includes(req.session.user._id);
        }

        if(!req.query.q)
        {
            req.query.q = null;
        }
        else
        {
            let searchInput;
            if(req.query.q)
            {
                searchInput = req.query.q;
                if(searchInput != "")
                {
                    allPosts = await Post.find({$or: 
                        [
                            { content: {$regex: searchInput, $options:"i"} },
                            { tags: {$regex: searchInput, $options:"i"} }
                        ]
                    });

                    allUsers = await User.find({ username: {$regex: searchInput, $options:"i"} });
                }
            }
        }

        res.render("SnapStream/post-details.ejs", { foundPost, isUserPost, isUser, isLiked, currentUser, userInfo, allPosts, allUsers, pageType, query:req.query.q  });
    }
    catch (error)
    {
        console.log(error);
    }
});

router.get("/:id/home", async (req, res) =>
{
    try
    {
        const foundPost = await Post.findById(req.params.id).populate("user").populate("comments.user");
        // this line is taken from the internet
        
        let allPosts;
        let isUserPost = false;
        let isUser = false;
        let currentUser;
        let userInfo;
        let isLiked;
        pageType = "home";
        if (req.session.user)
        {
            isUserPost = foundPost.user._id == req.session.user._id;
            isUser = true;

            currentUser = await User.findById(req.session.user._id);
            const followingUsers = currentUser.following.map(u => u._id);
            allPosts =  await Post.find({ user: { $in: followingUsers } }).sort({createdAt: -1}).populate("user");
            userInfo = 
            {
                posts: await Post.countDocuments({user: req.session.user._id}),
                following: currentUser.following.length,
                followers: currentUser.followers.length
            }

            isLiked = foundPost.likes.includes(req.session.user._id);
        }

        if(!req.query.q)
        {
            req.query.q = null;
        }
        res.render("SnapStream/post-details.ejs", { foundPost, isUserPost, isUser, isLiked, currentUser, userInfo, allPosts, pageType, query:req.query.q });
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
        const foundPost = await Post.findById(req.params.id).populate("user");
        if(JSON.stringify(foundPost.user._id) != JSON.stringify(req.session.user._id)) { return res.redirect("/snap-stream/profile/" + req.session.user._id); }
        cloudinary.uploader.destroy(foundPost.imageId);
        await Post.deleteOne(foundPost._id);
        res.redirect("/snap-stream/profile/" + req.session.user._id);
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
            user: req.session.user._id,
            content: req.body.content
        }
        foundPost.comments.push(comment);
        await foundPost.save();
        res.redirect("/snap-stream/" + req.params.id + "/" + pageType);
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

        if (foundPost.likes.includes(req.session.user._id))
        {
            foundPost.likes.splice(foundPost.likes.indexOf(req.session.user._id), 1);
            await foundPost.save();
        }
        else
        {
            foundPost.likes.push(req.session.user._id);
            await foundPost.save();
        }

        res.redirect("/snap-stream/" + req.params.id + "/" + pageType);
    }
    catch (error)
    {
        console.log(error);
    }
});



router.get("/search/posts", async (req, res) =>
{
    try
    {
        let allPosts;
        let allUsers;
        let currentUser;
        let userInfo;
        let showPosts = true;
        
        if(req.session.user)
        {
            currentUser = await User.findById(req.session.user._id);
            userInfo = 
            {
                posts: await Post.countDocuments({user: req.session.user._id}),
                following: currentUser.following.length,
                followers: currentUser.followers.length

            }
        }

        const searchInput = req.query.search;

        if(searchInput != "")
        {
            allPosts = await Post.find({$or: 
                [
                    { content: {$regex: searchInput, $options:"i"} },
                    { tags: {$regex: searchInput, $options:"i"} }
                ]
            });

            allUsers = await User.find({ username: {$regex: searchInput, $options:"i"} });
        }
        else
        {
            res.redirect("/snap-stream/search");
        }

        if(!req.query.search) req.query.search = null
        lastPage = "/snap-stream/search/posts?search=" + req.query.search;
        res.render("SnapStream/search.ejs", { foundUser: req.session.user, allPosts, currentUser, userInfo, allUsers, showPosts,query:req.query.search });
    }
    catch(error)
    {
        console.log(error);
    }
});



module.exports = router;
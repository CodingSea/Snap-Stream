const router = require("express").Router();
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

module.exports = router;
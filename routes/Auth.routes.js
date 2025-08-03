const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const validator = require("validator");

router.get("/sign-up", (req, res) =>
{
    res.render("Auth/sign-up.ejs", {errorMessage: ""});
});

router.post("/sign-up", async (req, res) =>
{
    try
    {
        if(!validator.isEmail(req.body.email))
        {
            return res.send("Enter the full email correctly");
        }

        const foundUserEmail = await User.find({email: req.body.email});
        const foundUserUsername = await User.find({username: req.body.username});
        console.log(req.body);
        console.log(foundUserEmail);
        console.log(foundUserUsername);
        if(foundUserEmail.length > 0)
        {
            return res.render("Auth/sign-up.ejs", {errorMessage: "Email is taken, try entering a new Email."});
        }
        if(foundUserUsername.length > 0)
        {
            return res.render("Auth/sign-up.ejs", {errorMessage: "Username is taken, try entering a new username."});
        }


        req.body.password = bcrypt.hashSync(req.body.password, 10);
    
        const createdUser = await User.create(req.body);

        req.session.user =
        {
            email: createdUser.email,
            username: createdUser.username,
            _id: createdUser._id
        }

        res.redirect("/snap-stream/profile/" + req.session.user._id);
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/login", (req, res) =>
{
    res.render("Auth/login.ejs", {errorMessage: ""});
});

router.post("/login", async (req, res) =>
{
    try
    {
        if(!validator.isEmail(req.body.email))
        {
            return res.send("Enter the full email correctly");
        }

        const foundUser = await User.findOne({email: req.body.email});
        const validatePassword = bcrypt.compareSync(req.body.password, foundUser.password);
        if(foundUser && validatePassword)
        {
            req.session.user =
            {
                email: foundUser.email,
                username: foundUser.username,
                _id: foundUser._id
            }

            res.redirect("/snap-stream/profile/" + req.session.user._id);
        }
        else
        {
            res.render("Auth/login.ejs", {errorMessage: "Incorrect Email or Password"});
        }
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/logout", (req, res) =>
{
    req.session.destroy();
    res.redirect("/");
});

router.get("/guest", (req, res) =>
{
    res.redirect("/snap-stream/search");
});


module.exports = router;
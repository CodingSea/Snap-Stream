const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const validator = require("validator");

router.get("/sign-up", (req, res) =>
{
    res.render("Auth/sign-up.ejs");
});

router.post("/sign-up", async (req, res) =>
{
    try
    {
        const allUsers = await User.find();

        if(!validator.isEmail(req.body.email))
        {
            return res.send("Enter the full email correctly");
        }

        allUsers.forEach((user) =>
        {
            if(user.username == req.body.username)
            {
                return res.send("username is taken, try entering a new username.");
            }

            if(user.email == req.body.email)
            {
                return res.send("email is taken, try entering a new email.");
            }

        });

        req.body.password = bcrypt.hashSync(req.body.password, 10);
    
        const createdUser = await User.create(req.body);
        res.redirect("/");
    }
    catch(error)
    {
        console.log(error);
    }
});

router.get("/login", (req, res) =>
{
    res.render("Auth/login.ejs");
});

module.exports = router;
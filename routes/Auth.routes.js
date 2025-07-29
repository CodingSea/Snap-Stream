const router = require("express").Router();
const User = require("../models/User");

router.get("/sign-up", (req, res) =>
{
    res.render("Auth/sign-up.ejs");
});

module.exports = router;
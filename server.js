const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const methodOverride = require("method-override");
const connectToDB = require("./config/db");
const session = require("express-session");
const bcrypt = require("bcrypt");

const authRoutes = require("./routes/Auth.routes");
const snapRoutes = require("./routes/SnapStream.routes");

app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(methodOverride("_method"));
app.use(morgan("dev"));

app.use
(
    session
    (
        {
            secret: process.env.SECRET_SESSION,
            resave: false,
            saveUninitialized: true,
        }
    )
);

connectToDB();

app.use("/auth", authRoutes);
app.use("/snap-stream", snapRoutes);

app.get("/", (req, res) =>
{
    res.render("home.ejs");
});

const port = process.env.PORT;
app.listen(port, () =>
{
    console.log("listening to port " + port);
});

// users page (view and search)
// profile page
// homepage (posts from following users)

// signup
// login
// logout
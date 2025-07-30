const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const methodOverride = require("method-override");
const connectToDB = require("./config/db");
const session = require("express-session");
const bcrypt = require("bcrypt");
const isSignedIn = require("./middleware/isSignedIn");
const passUserToView = require("./middleware/passUserToViewer");
const cloudinary = require('cloudinary').v2;

const authRoutes = require("./routes/Auth.routes");
const snapRoutes = require("./routes/SnapStream.routes");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
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

cloudinary.config
({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET
});

connectToDB();

// copied from the internet
app.use((req, res, next) =>
{
    if (!req.session.history)
    {
        req.session.history = [];
    }

    if (req.session.history[req.session.history.length - 1] !== req.originalUrl)
    {
        req.session.history.push(req.originalUrl);
    }
    next();
});

app.get("/", (req, res) =>
{
    res.render("home.ejs");
});
app.use("/snap-stream", snapRoutes);

app.use(passUserToView);

app.use("/auth", authRoutes);

app.use(isSignedIn);
app.use("/snap-stream", snapRoutes);


const port = process.env.PORT;
app.listen(port, () =>
{
    console.log("listening to port " + port);
});

// users page (view and search) [x]
// profile page [x]
// homepage (posts from following users)
// settings

// signup [x]
// login [x]
// logout [x]
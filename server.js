const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const methodOverride = require("method-override");
const connectToDB = require("./config/db");
const session = require("express-session");

const authRoutes = require("./routes/Auth.routes");

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

app.use("/Auth", authRoutes);

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
const mongoose = require("mongoose");

async function connectToDB()
{
    try
    {
        await mongoose.connect(process.env.DB);
        console.log("Connected to DB");
    }
    catch(error)
    {
        console.log(error);
    }
}

module.exports = connectToDB;
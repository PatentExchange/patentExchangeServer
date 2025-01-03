const mongoose = require("mongoose");
const connectDB = async () =>{
    try{
        mongoose.connect(process.env.MONGO_URI);
            console.log("connected to mongodb database");
    }catch(error){
        console.log("error connecting to database"+ error)
    }
};
module.exports = connectDB;
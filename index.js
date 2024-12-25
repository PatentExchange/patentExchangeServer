const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const argon2 = require("argon2")
const UserModel = require("./models/Users")
require("dotenv").config()

const app = express()
app.use(express.json())
app.use(cors())

try{
    mongoose.connect("mongodb://localhost:27017/patentExchange")
    console.log("connected to mongodb database")
}catch(error){
    console.log("error connecting to database"+ error)
}

app.post("/signup",(req,res)=>{
    UserModel.create(req.body).then(u=>res.json(u)).catch(e=>res.json(e))
})

app.post("/login",(req,res)=>{
    const uf= UserModel.findOne({email:req.body.email});
    if(uf){
        const isPasswordValid  = argon2.verify(uf.password,req.body.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password." });
        }

        res.status(200).json({ message: "Login successful!" });
    }else{
        console.error(error);
        res.status(500).json({ message: "An error occurred during login.", error });
    }
})

app.listen(3002,()=>{console.log("Server has started")})
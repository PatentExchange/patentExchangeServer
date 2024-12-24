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

app.get("/login",(req,res)=>{
    const uf= UserModel.findOne({email:req.body.email});
    if(uf){
        const vp = argon2.verify(uf.password,req.body.password);
        if(vp){
            res.json({message:"Login Successful!"})
        }else{
            res.json({message:"invalid Password"})
        }
    }else{
        res.json("No such user! Please Sign up.")
    }
})

app.listen(3002,()=>{console.log("Server has started")})
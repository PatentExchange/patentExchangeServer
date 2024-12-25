const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const argon2 = require("argon2")
const UserModel = require("./models/Users")
const jwt = require("jsonwebtoken")
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

app.post("/login",async (req,res)=>{
    const uf= await UserModel.findOne({email:req.body.email});
    if(uf){
        const isPasswordValid  = await argon2.verify(uf.password,req.body.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password." });
        }
        const token = jwt.sign({id: uf._id,name: uf.name,email:uf.email},process.env.JWT_SECRET)
        res.status(200).json({ message: "Login successful!" ,token});
    }else{
        
        res.status(500).json({ message: "An error occurred during login.", error });
    }
})

app.get("/get-user/:id",async(req,res)=>{
    const id = req.params.id;
    const uf = await UserModel.findById({_id:id}).then((user)=>{
        res.json(user);
        console.log(user)
    }).catch(err=>res.json(err));

})

app.listen(3002,()=>{console.log("Server has started")})
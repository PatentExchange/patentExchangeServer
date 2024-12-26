const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const argon2 = require("argon2")
const UserModel = require("./models/Users")
const jwt = require("jsonwebtoken")
const dayjs = require("dayjs")
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

app.post("/signup",async (req,res)=>{
    try {
        const user = await UserModel.create(req.body);
        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET);
        res.status(201).json({ message: "Signup successful!", token });
    } catch (e) {
        res.status(500).json({ message: "An error occurred during signup.", error: e });
    }
})

app.post("/login",async (req,res)=>{
    const uf= await UserModel.findOne({email:req.body.email});
    if(uf){
        const isPasswordValid  = await argon2.verify(uf.password,req.body.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password." });
        }
        uf.lastLogin = dayjs().format("MM/DD/YYYY HH:mm:ss");
        await uf.save();
        const token = jwt.sign({id: uf._id,name: uf.name,email:uf.email},process.env.JWT_SECRET)
        res.status(200).json({ message: "Login successful!" ,token});
    }else{
        
        res.status(500).json({ message: "An error occurred during login.", error });
    }
})
app.get("/get-all-users",async(req,res)=>{
    await UserModel.find().then((users)=>res.json(users)).catch((err)=>(res.json(err)))
})
app.get("/get-user/:id",async(req,res)=>{
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
    const uf = await UserModel.findById({_id:new mongoose.Types.ObjectId(id)}).then((user)=>{
        res.json(user);
    }).catch(err=>res.json(err));

})

app.listen(3002,()=>{console.log("Server has started")})
const mongoose = require("mongoose")
const argon2 = require("argon2")

const userSchema = new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
})

userSchema.pre('save',async function (next){
    if(!this.isModified("password") ) return next();
    this.password = await argon2.hash(this.password);
    next();
})

const UserModel = mongoose.model("Users",userSchema);
module.exports=UserModel;
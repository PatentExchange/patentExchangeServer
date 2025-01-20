const mongoose = require("mongoose")
const argon2 = require("argon2")
const dayjs = require("dayjs")

const userSchema = new mongoose.Schema({
    name:{type:String},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    role:{type:String,default:"User"},
    status:{type:String,default:"Active"},
    lastLogin:{type:Date},
    verified:{type:Boolean,default:false},
    createdAt:{type:Date,default:dayjs().format("MM/DD/YYYY HH:mm:ss")},
    updatedAt:{type:Date,default:dayjs().format("MM/DD/YYYY HH:mm:ss")}
})

userSchema.pre('save',async function (next){
    if(!this.isModified("password") ) return next();
    this.password = await argon2.hash(this.password);
    next();
})//before the document is saved to the db, this function will be fired

//for firing a function after the document is saved to the db , use userSchema.post('save',function(doc,next){})

const UserModel = mongoose.model("Users",userSchema);
module.exports=UserModel;
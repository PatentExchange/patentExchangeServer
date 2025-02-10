const argon2 = require("argon2")
const UserModel = require("../models/Users")
const OtpVerifModel = require("../models/OtpVerif")
const jwt = require("jsonwebtoken")
const dayjs = require("dayjs")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")
var ObjectId = require('mongodb').ObjectId;


const handleErrors = (err,res)=>{
    console.log(err.message,err.code);
    if(err.code === 11000){
        return res.status(400).send({message:"User already exists."});
    }
    res.status(400).send({message:err.message,code:err.code});
}

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth:{
        user:process.env.AUTH_EMAIL,
        pass:process.env.AUTH_PASS,
    }
})

exports.signup = async (req, res) => {
    try {
        const user = await UserModel.create(req.body);
        await sendOTPVerificationMail(user,res);
        //res.json({ message: "Signup successful!", token });
        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET);
        res.status(201).json({
            status:"PENDING",
            message: "OTP Verification Pending.",
            user,token
        });
    } catch (e) {
        handleErrors(e,res);
    }
};
exports.verifyOTP = async (req,res)=>{
    try{
        
        const otpObj = await OtpVerifModel.find({userId:req.body.userId});
        const id = req.body.userId;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        if(otpObj.length <= 0){
            throw new Error("ACcound record doesn't exist or has been verified already. Please Sign up or login");
        }
        else if(otpObj){
            const {expiresAt} = otpObj[0];
            if(expiresAt<Date.now()){
                await OtpVerifModel.deleteMany({userId:req.body.userId});
                throw new Error("Code Has Expired. Generate A new OTP!")
            }else{
                const isValidOtp = await argon2.verify(otpObj[0].otp,req.body.otp);
                if(!isValidOtp)
                    throw new Error("Invalid code passed. Check again!");
                try{
                    const user = await UserModel.findById(id);
                    user.verified = true;
                    await user.save();
                    await OtpVerifModel.deleteMany({userId:req.body.userId});
                    return res.status(201).json({message:"valid OTP."})
                }catch(error){
                    res.status(500).json({ message: "An error occurred while fetching the user.", error });
                }

            }
        } 
    }catch(error){
        handleErrors(error,res);
    }
}
exports.login = async (req, res) => {
    try {
        const uf = await UserModel.findOne({ email: req.body.email });
        if (uf) {
            const isPasswordValid = await argon2.verify(uf.password, req.body.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Invalid password." });
            }
            uf.lastLogin = dayjs().format("MM/DD/YYYY HH:mm:ss");
            await uf.save();
            const token = jwt.sign({ id: uf._id, name: uf.name, email: uf.email }, process.env.JWT_SECRET);
            res.status(200).json({ message: "Login successful!", token, uf });
        } else {
            res.status(400).json({ message: "User not found." });
        }
    } catch (error) {
        res.status(500).json({ message: "An error occurred during login.", error });
    }
};

exports.forgotPassword = async (req,res)=>{
    
    const {email} = req.body;
    console.log(email);
    try{
        const user = await UserModel.findOne({email:email});
        
        if(!user){
            return res.send({Status:"User does'nt exist!"})
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"})
        console.log(token);
        const _id = user._id.toString();
        console.log(_id)
        await sendForgotPasswordMails({_id,token,email});
        res.status(201).json({
            status:"PENDING",
            message: "OTP Verification Pending.",
            user,token
        });
    }catch(error){
        res.status(400).json({ status:"FAILED",message: error.message });
    }

}

exports.resetPassword = async (req,res)=>{
    const {_id,token}=req.params;
    const {password}= req.body;
    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
            return res.json({Status:"Error with token"});
        }else{
            argon2.hash(password).then((hash)=>{
                UserModel.findByIdAndUpdate({_id:_id},{password:hash}).then(u=>{
                    console.log("updated with :",password);
                    res.send({Status:"Success"});
                }).catch(err=>{
                    res.send({Status:err})
                });
            }).catch(err=>{
                res.send({Status:err})
            });
        }
    });
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching users.", error });
    }
};

exports.getUserById = async (req, res) => {
    console.log(req.body.token);
    let decoded;
        try {
            decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }
    try {
        const user = await UserModel.findById(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching the user.", error });
    }

};

//Function for sending otp
const sendOTPVerificationMail=async({_id,email,token},res)=>{
    try{
        const OTP = `${Math.floor(1000+Math.random()*9000)}`;
        const hashedOTP = await argon2.hash(OTP);
        const mailOptions={
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: `Your PatentExchange OTP Code: [${OTP}]`,
            html: `
                <p>Thank you for using PatentExchange.com. Your One-Time Password (OTP) for verification is:<br>
                <b>${OTP}</b><br>
                This OTP is valid for the next 10 minutes. Please do not share this code with anyone for security purposes.
                <br><br>
                If you did not request this OTP, please contact our support team immediately.</p>
                <p>
                Best regards,<br>
                The PatentExchange Team<br>
                PatentExchange.com
                </p>
            `
        };
        const newOtpVerif= await new OtpVerifModel({
            userId:_id,
            otp:hashedOTP,
            createdAt:Date.now(),
            expiresAt:Date.now()+600000,
        });

        await newOtpVerif.save();
        await transporter.sendMail(mailOptions);
        
    }catch(err){
        res.json({
            status:"FAILED",
            message:err.message
        })
    }
}

const sendForgotPasswordMails=async({_id,token,email},res)=>{
    try{
        const mailOptions = {
            
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Reset Your Password - PatentExchange",
            html: `
              <p>Dear User,</p>
              <p>We received a request to reset your password for your PatentExchange account. If you made this request, please click the link below to reset your password:</p>
              <p>
                <a href="https://patentexchangeserver.onrender.com/reset-password/${_id}/${token}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
              </p>
              <p>This link is valid for the next 10 minutes. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <br>
              <p>For additional assistance, please contact our support team.</p>
              <p>
                Best regards,<br>
                The PatentExchange Team<br>
                <a href="https://PatentExchange.com" target="_blank">PatentExchange.com</a>
              </p>
            `,
          };
        
        await transporter.sendMail(mailOptions);
        
    }catch(err){
        
        res.json({
            status:"FAILED",
            message:err.message
        })
    }
}
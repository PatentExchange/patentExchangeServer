const argon2 = require("argon2")
const UserModel = require("../models/Users")
const OtpVerifModel = require("../models/OtpVerif")
const jwt = require("jsonwebtoken")
const dayjs = require("dayjs")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")


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
        res.status(500).json({ message: "An error occurred during signup.", error: e });
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
        res.status(400).json({ status:"FAILED",message: error.message });
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
            res.status(200).json({ message: "Login successful!", token });
        } else {
            res.status(400).json({ message: "User not found." });
        }
    } catch (error) {
        res.status(500).json({ message: "An error occurred during login.", error });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching users.", error });
    }
};

exports.getUserById = async (req, res) => {
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
const sendOTPVerificationMail=async({_id,email},res)=>{
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
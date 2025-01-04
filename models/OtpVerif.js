const mongoose = require("mongoose");

const OtpVerifSchema = new mongoose.Schema({
    userId:{type:String},
    otp:{type:String},
    createdAt : {type:Date},
    expiresAt : {type:Date}
});

const OtpVerifModel = mongoose.model(
    "OtpVerif",OtpVerifSchema
);

module.exports = OtpVerifModel;
const mongoose = require('mongoose');
const orderModel = require('../models/Orders');
const PatentModel = require('../models/Patents');
const UserModel = require('../models/Users');
const handleErrors = (err,res)=>{
    console.log(err.message,err.code);
    if(err.code === 11000){
        return res.status(400).send({message:"User already exists."});
    }
    res.status(400).send({message:err.message,code:err.code});
}
exports.adminDashboardDetails = async(req,res)=>{
    try{
        const noOfUsers = await UserModel.countDocuments();
        const activeUsers = await UserModel.countDocuments({status:"Active"});
        const inactiveUsers = await UserModel.countDocuments({status:"Inactive"});
        const suspendedUsers = await UserModel.countDocuments({status:"Suspended"});
        const noOfPatents = await PatentModel.countDocuments();
        const pendingPatents = await PatentModel.countDocuments({status:"Pending"});
        const approvedPatents = await PatentModel.countDocuments({status:"Approved"});
        const rejectedPatents = await PatentModel.countDocuments({status:"Rejected"});
        res.status(201).json({noOfUsers,activeUsers,inactiveUsers,suspendedUsers,noOfPatents,pendingPatents,approvedPatents,rejectedPatents});
    }catch(err){
        handleErrors(err,res);
    }
}

exports.updateUser = async(req,res)=>{
    try{
        const id = req.body.selectedUser._id;
        console.log(id);
        const user = await UserModel.findById({_id:id});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const updatedUser = await UserModel.findByIdAndUpdate(id,req.body.selectedUser);
        return res.status(200).json({message:"User details updated successfully",updatedUser});
    }catch(err){
        handleErrors(err,res);
    }
}
exports.suspendUser = async(req,res)=>{
    try{
        const id = req.body.selectedUser._id;
        console.log(id);
        const user = await UserModel.findById({_id:id});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const updatedUser = await UserModel.findByIdAndUpdate(id,{status:"Suspended"});
        return res.status(200).json({message:"User details updated successfully",updatedUser});
    }catch(err){
        handleErrors(err,res);
    }
}
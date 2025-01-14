const mongoose = require('mongoose');
const orderModel = require('../models/Orders');
const PatentModel = require('../models/Patents');
const UserModel = require('../models/Users');

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
        res.status(500).json({message:"An error occurred while fetching dashboard details",error:err.message});
    }
}
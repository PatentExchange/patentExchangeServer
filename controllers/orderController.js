const mongoose = require("mongoose");
const orderModel = require("../models/Orders");

exports.addOrders = async (req,res)=>{
    try{
        const order = await orderModel.create(req.body);
        res.status(201).json({
            status:"Success",
            order
        })
    }catch(err){
        res.status(500).json({message:"an error occurred while creating the order",error:err});
    }
};
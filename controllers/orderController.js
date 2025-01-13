const mongoose = require("mongoose");
const orderModel = require("../models/Orders");
const patentModel = require("../models/Patents");
exports.addOrders = async (req,res)=>{
    try{
        const order = await orderModel.create(req.body);
        console.log("Oder created :", order );
        res.status(201).json({
            status:"Success",
            order
        })
    }catch(err){
        res.status(500).json({message:"an error occurred while creating the order",error:err});
    }
};

exports.getUserOrders = async (req,res)=>{
    try{
        // console.log("req recieved",req.body);
        const orders = await orderModel.find({userId:req.body.userId});
        // console.log(orders)
        res.status(200).json({
            status:"Success",
            orders
        });
    }catch(err){
        res.status(500).json({message:"an error occurred while fetching the orders",error:err});
    }
}

exports.getOrderedPatents = async (req,res)=>{
    try{
        const patents = req.body.patents;
        console.log(patents);
        if(!Array.isArray(patents) ||  patents.length === 0){
            return res.status(400).json({message:"Invalid input"});
        }

        const matchingPatent = await patentModel.find({title:{$in:patents}});
        console.log(matchingPatent);
        if (matchingPatent.length === 0) {
            return res.status(404).json({ message: "No matching patents found" });
        }
        res.status(200).json({
            status: "Success",
            patents: matchingPatent,
        });
        
    }catch (err) {
        res.status(500).json({
          message: "An error occurred while fetching patent details",
          error: err.message,
        });
      }
}
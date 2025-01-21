const express = require("express");
const transferModel = require("../models/Transfers");
const userModel = require("../models/Users");
const patentModel = require("../models/Patents");
const interestedBuyersModel = require("../models/InterestedBuyers");

const handleErrors = (err,res)=>{
    console.log(err.message,err.code);
    if(err.code === 11000){
        return res.status(400).send({message:"User already exists."});
    }
    res.status(400).send({message:err.message,code:err.code});
}

exports.addTransfer = async(req,res)=>{
    const sellerEmail= req.body.sellerEmail;
    const buyerEmail=req.body.buyerEmail;
    try{
        const seller = await userModel.findOne({email:sellerEmail});
        const buyer = await userModel.findOne({email:buyerEmail});
        const patent = req.body.patentId;
        const transferStatus = req.body.transferStatus;
        const transfer = new transferModel({
            buyer: buyer._id,
            seller: seller._id,
            patent: patent,
            transferStatus: transferStatus
        });
        const result = await transfer.save();
        res.status(201).send(result);
    }catch(err){
        handleErrors(err,res);
    }
}

exports.getTransfers = async(req,res)=>{
    try{
        const buyer = await userModel.findOne({email:req.body.email});
        const transfer = await transferModel.find({buyer:buyer._id});
        const result = await Promise.all(
            transfer.map(async (t) => {
                const seller = await userModel.findById(t.seller);
                const patent = await patentModel.findById(t.patent);
                return { ...t.toObject(), seller, patent };
            })
        );
        res.status(200).send({ buyer, transfers: result });
    }catch(err){
        handleErrors(err,res);
    }
}

exports.addToInterestedBuyers = async(req,res)=>{
    try{
        const patentId = req.body.patentId;
        const buyerEmail = req.body.email;
        const buyer = await userModel.findOne({email:buyerEmail});
        const interestedBuyers = await interestedBuyersModel.findOneAndUpdate(
            { patentId: patentId },
            { $addToSet: { users: buyer._id } }, // Appends if not already present
            { upsert: true, new: true } // Creates a new document if none exists
        );
        res.status(200).send(interestedBuyers);
    }catch(err){
        handleErrors(err,res);
    }
}

exports.getInterestedBuyers = async(req,res)=>{
    try{
        const patentId = req.body.patentId;
        const interestedBuyers = await interestedBuyersModel.findOne({patentId:patentId});
        if (!interestedBuyers) {
            return res.status(200).send({ users: [] });
        }
        const userObjects = await Promise.all(
            interestedBuyers.users.map(userId => userModel.findById(userId))
        );
        res.status(200).send({ users: userObjects });
    }catch(err){
        handleErrors(err,res);
    }
}

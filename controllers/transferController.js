const express = require("express");
const transferModel = require("../models/Transfers");
const userModel = require("../models/Users");
const patentModel = require("../models/Patents");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } =require("@aws-sdk/s3-request-presigner");

const interestedBuyersModel = require("../models/InterestedBuyers");


const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyVariable = process.env.ACCESS_KEY_VARIABLE;
const secretAccessKeyVariable = process.env.SECRET_ACCESS_KEY_VARIABLE;

const s3 = new S3Client ({
    credentials:{
        accessKeyId:accessKeyVariable,
        secretAccessKey: secretAccessKeyVariable,
    },
    region: bucketRegion
});

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
        const seller = await userModel.findOne({name:sellerEmail});
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
        console.log(transfer)
        // const result = await Promise.all(
        //     transfer.map(async (t) => {
        //         const seller = await userModel.findById(t.seller);
        //         const patent = await patentModel.findById(t.patent);
        //         return { ...t.toObject(), seller, patent };
        //     })
        // );
        const patents = await Promise.all(
            transfer.map(async (t)=>{
                const patent = await patentModel.findById(t.patent);
                await Promise.all(
                    patent.images.map(async (img, index) => {
                        if (img) {
                            const key = "images/" + await img.split('/').pop();  // Extract the key from the image URL
                            const getObjectparams = {
                                Bucket: bucketName,
                                Key: key,
                            };
                            const command = new GetObjectCommand(getObjectparams);
                            const url = await getSignedUrl(s3, command, { expiresIn: 604800 });
                            patent.images[index] = url;  // Replace the image URL with the signed URL
                        }
                    })
                );
                // console.log("patents are : ",patent)
                const status = t.transferStatus;
                return {patent,status};
            })
        )
        res.status(200).send({ patents});
    }catch(err){
        handleErrors(err,res);
    }
}

exports.addToInterestedBuyers = async(req,res)=>{
    try{
        console.log(req.body.formData);
        const patentId = req.body.patentId;
        const interestedBuyers = await interestedBuyersModel.findOneAndUpdate(
            { patentId: patentId },
            { $addToSet: { buyers: req.body.formData } }, // Appends if not already present
            { upsert: true, new: true } // Creates a new document if none exists
        );
        res.status(200).send(interestedBuyers);
    }catch(err){
        handleErrors(err,res);
    }
}

exports.updateBuyersStatus = async (req,res)=>{
    try {
        const { patentId, buyerEmail , status } = req.body;
        const newStatus = status;
        const buyer = await userModel.findOne({email:buyerEmail});
        console.log(buyer);
            const updatedDoc = await interestedBuyersModel.findOneAndUpdate(
                { patentId, "buyers.email": buyerEmail },
                { $set: { "buyers.$.status": newStatus } },
                { new: true }
            );
            const transfer = await transferModel.findOneAndUpdate({
                patent:patentId,
                buyer:buyer._id,
                seller:req.body.sellerId,
            },{$set:{transferStatus:newStatus}})
            console.log(transfer)
            if (!updatedDoc) {
                return res.status(404).send({ message: "Buyer not found" });
            }
        res.status(200).send({ message: "Buyer status updated", updatedDoc });
    } catch (err) {
        handleErrors(err, res);
    }
}

exports.getInterestedBuyers = async(req,res)=>{
    try{
        const patentId = req.body.patentId;
        const interestedBuyers = await interestedBuyersModel.findOne({patentId:patentId});
        res.status(200).send({ interestedBuyers });
    }catch(err){
        handleErrors(err,res);
    }
}


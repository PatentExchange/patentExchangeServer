const express = require("express");
const transferModel = require("../models/Transfers");
const userModel = require("../models/Users");
const patentModel = require("../models/Patents");
const Party = require ("../models/PartyModel");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } =require("@aws-sdk/s3-request-presigner");
const mongoose = require("mongoose")

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
    //console.log(err.message,err.code);
    if(err.code === 11000){
        return res.status(400).send({message:"User already exists."});
    }
    res.status(400).send({message:err.message,code:err.code});
}

exports.addTransfer = async(req,res)=>{

    try{
        //console.log(req.body.buyer.id);
        const buyer = req.body.buyer.id;
        const sellers = req.body.sellers;
        const patent = req.body.patentId;
        
        const transfer = new transferModel({
            buyer,
            sellers,
            patent
            
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
        //console.log(transfer)
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
        //console.log(req.body.formData);
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
        //console.log(req.body);
        const { patent, buyers, sellerId } = req.body;

        if (!patent || !Array.isArray(buyers) || buyers.length === 0 || !sellerId) {
            return res.status(400).json({ message: "Invalid request data" });
        }
        const buyersArray = Array.isArray(buyers) ? buyers : [buyers];
        const patentId = new mongoose.Types.ObjectId(patent._id); // Convert patent ID to ObjectId
        const sellerObjectIds = sellerId.map(id => new mongoose.Types.ObjectId(id));       
        // Loop through buyers and update each one's status
        let party = new Party({
                patentId,
                buyers: [], // Initialize an empty buyers array
            });
        let addParty = true;
        let changeOwnerShip = true;
        const buyerUpdates = buyers.map(async (buyer) => {
            const updatedBuyer = await interestedBuyersModel.findOneAndUpdate(
                { patentId, "buyers.email": buyer.email },
                { $set: { "buyers.$.status": buyer.status } },
                { new: true }
            );
            const buyerRecord = await userModel.findOne({email:buyer.email});
            const buyerId = buyerRecord._id;
            if (!updatedBuyer) {
                //console.log(`Buyer with email ${buyer.email} not found`);
                return null;
            }
            const existingTransfer = await transferModel.findOne({
                                patent: patentId,
                                buyer: buyerId,
                                sellers: { $in: sellerObjectIds }
                            });
                
                            if (!existingTransfer) {
                                //console.log(`Transfer record not found for Buyer ID: ${buyer.id}`);
                            }
            // Update transfer status for the buyer
            const updatedTransfer = await transferModel.findOneAndUpdate(
                {
                    patent: patentId,
                    buyer: buyerId,
                    sellers: {$in : sellerObjectIds},
                },
                { $set: { transferStatus: buyer.status } },
                { new: true }
            );

            
            if (buyer.status === "approved") {
                const existingBuyerIndex = party.buyers.findIndex((b) => b.buyerId.equals(buyerId));

                if (existingBuyerIndex !== -1) {
                // If buyer already exists in party, update their status
                party.buyers[existingBuyerIndex].status = buyer.status;
                } else {
                // If buyer does not exist, add them to the party
                party.buyers.push({ buyerId, status: buyer.status });
                }
            }else{
                addParty=false;
            }
            
            if(buyer.status !== "Completed")
                changeOwnerShip = false;
              return { updatedBuyer, updatedTransfer };
        });
        
        const updatedBuyers = await Promise.all(buyerUpdates);
        if (addParty) {
            await party.save();
        }
        const successfulUpdates = updatedBuyers.filter((buyer) => buyer !== null);

        if (successfulUpdates.length === 0) {
            return res.status(404).json({ message: "No buyers were updated" });
        }

        res.status(200).json({ message: "Buyers status updated successfully", updatedBuyers: successfulUpdates });
    } catch (err) {
        handleErrors(err, res);
    }
}

exports.getInterestedBuyers = async(req,res)=>{
    try{
        const patentId = req.body.patentId;
        const interestedBuyers = await interestedBuyersModel.findOne({patentId:patentId});
        //console.log(interestedBuyers);
        res.status(200).send({ interestedBuyers });
    }catch(err){
        handleErrors(err,res);
    }
}
exports.removeBuyer = async(req,res)=>{
    try{
        const { patentId, buyersToDelete } = req.body;

        if (!patentId || !Array.isArray(buyersToDelete) || buyersToDelete.length === 0) {
        return res.status(400).json({ message: "Invalid request data" });
        }

        const buyerObjectIds = buyersToDelete.map((id) => new mongoose.Types.ObjectId(id));
        const result = await interestedBuyersModel.findOneAndUpdate(
            { patentId: new mongoose.Types.ObjectId(patentId) },
            { $pull: { buyers: { _id: { $in: buyerObjectIds } } } }, // Remove matching buyers
            { new: true } // Return updated document
        );

        if (!result) {
            return res.status(404).json({ message: "Patent not found or no buyers removed" });
        }
        res.status(200).json({
            message: "Buyers removed successfully",
            updatedPatentBuyers: result,
        });
    }catch(err){
        handleErrors(err,res);
      }
}


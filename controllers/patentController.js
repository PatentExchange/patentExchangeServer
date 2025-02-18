const mongoose = require("mongoose")
const PatentModel = require("../models/Patents")
const transferModel = require("../models/Transfers")
const multer = require("multer")
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const { getSignedUrl } =require("@aws-sdk/s3-request-presigner");
const InterestedBuyers = require("../models/InterestedBuyers");
const UserModel = require("../models/Users");
const Party = require("../models/PartyModel");


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyVariable = process.env.ACCESS_KEY_VARIABLE;
const secretAccessKeyVariable = process.env.SECRET_ACCESS_KEY_VARIABLE;


const handleErrors = (err,res)=>{
    //console.log(err.message,err.code);
    if(err.code === 11000){
        return res.status(400).send({message:"User already exists."});
    }
    res.status(400).send({message:err.message,code:err.code});
}

const s3 = new S3Client ({
    credentials:{
        accessKeyId:accessKeyVariable,
        secretAccessKey: secretAccessKeyVariable,
    },
    region: bucketRegion
});

async function uploadToS3(file, folder) {
    const key = `${folder}/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
  
    await s3.send(new PutObjectCommand(params));
    return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
  }


exports.addPatent = [
    upload.fields([{
        name:"supportedDocuments",maxCount:10
    },
    {
        name:"images",maxCount:10
    }]),
    async(req,res)=>{
        try{
            console.log("req received",req.body);
            const {body,files}=req;
            const supportedDocumentsUrls = files.supportedDocuments
            ? await Promise.all(
                files.supportedDocuments.map((file) =>
                  uploadToS3(file, "supportedDocuments")
                )
              )
            : [];
            const imageUrls = files.images
        ? await Promise.all(
                files.images.map(async (file) => uploadToS3(file, "images")))
        : [];
        const ownerIds = Array.isArray(body.owner) 
        ? body.owner.map(id => new mongoose.Types.ObjectId(id)) 
        : body.owner 
          ? [new mongoose.Types.ObjectId(body.owner)] 
          : [];
        const ownersData = await UserModel.find({ _id: { $in: ownerIds } }).select("name");
      const ownerNames = ownersData.map((user) => user.name);    
        const patentData = {
                title: body.title,
                owner: ownerIds,
                ownerNames: ownerNames,
                submissionDate: body.submissionDate,
                filingDate: body.filingDate,
                priorityDate: body.priorityDate,
                assignee: body.assignee,
                description: body.description,
                category: body.patentClassification,
                priorArtReferences: body.priorArtReferences,
                type: body.type,
                status: body.status,
                supportedDocuments: supportedDocumentsUrls,
                verifiedBySME: body.verifiedBySME === "true" ? "requested" : "false",
                images: imageUrls,
              };
              const patent = new PatentModel(patentData);
                await patent.save();
               // console.log("Patent saved successfully",patent);
                res.status(200).json({ message: "Patent saved successfully", patent });
        }catch(error){
           
            handleErrors(error,res);
        }
    }
]
exports.getPatents = async (req,res) => {
   // console.log(req.params.owner)
    const id = new mongoose.Types.ObjectId(req.params.owner);
    console.log(id);
    try{
        //console.log("Get patent req recieved")
        const patents = await PatentModel.find({ owner: { $in: [id] } });
        // //console.log(patents);
        for (const patent of patents) {
            //console.log("Processing patent:", patent.title);
            await Promise.all(
                patent.images.map(async (img, index) => {
                    if (img) {
                        const key = "images/"+await img.split('/').pop();  // Extract the key from the image URL
                        //console.log("Image Key:", key);

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
            await Promise.all(
                patent.supportedDocuments.map(async (img, index) => {
                    if (img) {
                        const key = "supportedDocuments/"+await img.split('/').pop();  // Extract the key from the image URL
                        //console.log("Image Key:", key);

                        const getObjectparams = {
                            Bucket: bucketName,
                            Key: key,
                        };

                        const command = new GetObjectCommand(getObjectparams);
                        const url = await getSignedUrl(s3, command, { expiresIn: 604800 });
                        patent.supportedDocuments[index] = url;  // Replace the image URL with the signed URL
                    }
                })

            );
            //console.log("done");
        }
        //console.log(req.params.owner ,patents)
     res.status(200).json(patents);

    }catch(error){
        handleErrors(error,res);
    }
}
exports.appendPatentFiles = [
    upload.array("supportedDocuments", 10), // Handle multiple file uploads
    async (req, res) => {
      try {
        //console.log("req recieved")
        const { patentId } = req.body;
        const {files} = req;
        //
        // console.log(files);
        if (!mongoose.Types.ObjectId.isValid(patentId)) {
          return res.status(400).json({ message: "Invalid Patent ID" });
        }
        const patent = await PatentModel.findById(patentId);
        if (!patent) {
          return res.status(404).json({ message: "Patent not found" });
        }
        const newFilesUrls = files.length
          ? await Promise.all(
              files.map((file) => uploadToS3(file, "supportedDocuments"))
            )
          : [];
        //console.log(newFilesUrls);
        patent.supportedDocuments = [...patent.supportedDocuments, ...newFilesUrls];
        //console.log(patent.supportedDocuments);
        await patent.save();
        res.status(200).json({
          message: "Files appended successfully",
          patent,
        });
      } catch (error) {
        handleErrors(err,res);
      }
    },
  ];
  
exports.getAllPatent = async (req,res) =>{
    try{
        const patents = await PatentModel.find();
        for (const patent of patents) {
            //console.log("Processing patent:", patent.title);
            await Promise.all(
                patent.images.map(async (img, index) => {
                    if (img) {
                        const key = "images/"+await img.split('/').pop();  // Extract the key from the image URL
                        //console.log("Image Key:", key);

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
            //console.log("done");
        }
        res.status(200).json({patents});
    }catch(err){
        handleErrors(err,res);
    }
}

exports.getFileUrls=async(req,res)=>{
    try{
        const patent= await PatentModel.findById(req.body.patent._id);
        // console.log(patent);
        if (!patent.supportedDocuments || !Array.isArray(patent.supportedDocuments)) {
            return res.status(400).json({ status: "Error", message: "supportedDocuments is missing or not an array" });
        }
        docs= patent.supportedDocuments;
        await Promise.all(
            docs.map(async (doc, index) => {
                if (doc) {
                    const key = "supportedDocuments/"+await doc.split('/').pop();
                    const getObjectparams = {
                        Bucket: bucketName,
                        Key: key,
                    };

                    const command = new GetObjectCommand(getObjectparams);
                    const url = await getSignedUrl(s3, command, { expiresIn: 604800 });
                    patent.supportedDocuments[index] = url; 
                }
            })
        );
        //console.log(patent.supportedDocuments);
        res.status(200).json({status:"Success", docs: patent.supportedDocuments});
    }catch(err){
        handleErrors(err,res)
    }
}

exports.updatePatentOwner=async (req,res)=>{
    console.log("recieved req",req.body);
    try{
        const {patent,buyerId,status} = req.body;
        if (!patent || !buyerId || !status) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const patentId = new mongoose.Types.ObjectId(patent);
        const buyerObjectId = new mongoose.Types.ObjectId(buyerId);
        const updatedParty = await Party.findOneAndUpdate(
            { patentId, "buyers.buyerId": buyerObjectId },
            { $set: { "buyers.$.status": status } },
            { new: true }
        );

        if (!updatedParty) {
            return res.status(404).json({ message: "Party not found or buyer update failed" });
        }

        console.log("Updated Buyer Status:", updatedParty);

        // ✅ Step 2: Check if all buyers' statuses are "Completed"
        const allCompleted = updatedParty.buyers.every(buyer => buyer.status === "Completed");

        if (allCompleted) {
            console.log("All buyers have completed status, updating patent owner...");

            // Extract new owners from the buyer list
            const newOwnerIds = updatedParty.buyers.map(buyer => new mongoose.Types.ObjectId(buyer.buyerId));
            const newOwnerNames = await Promise.all(
                updatedParty.buyers.map(async buyer => {
                    const user = await UserModel.findById(buyer.buyerId).select("name");
                    return user ? user.name : "Unknown"; // Fallback if user not found
                })
            );

            // ✅ Step 3: Update the patent owner and ownerNames in the Patent collection
            const updatedPatent = await PatentModel.findOneAndUpdate(
                { _id: patentId },
                {
                    $set: {
                        owner: newOwnerIds,
                        ownerNames: newOwnerNames
                    }
                },
                { new: true }
            );
            console.log(updatedPatent);

            const deletedInterestedBuyers = await InterestedBuyers.findOneAndDelete({ patentId });
            console.log("Deleted InterestedBuyers:", deletedInterestedBuyers);
            const deletedTransfer = await transferModel.deleteMany({ patent: patentId });
            console.log("Deleted Transfers:", deletedTransfer);
            updatedParty.deleteOne();
        }   
    }catch(err){
        handleErrors(err,res);
    }
}

exports.updatePatent= async (req,res)=>{
    try {
        //console.log(req.body);
        // console.log("req received", req.files);
        const { body, files } = req;
        // console.log(files?.supportedDocuments);
        const deletedPatent = await PatentModel.findByIdAndDelete(req.params.id)
        //console.log("deleted patent :" ,deletedPatent);
        const supportedDocumentsUrls = files?.supportedDocuments
            ? await Promise.all(
                files?.supportedDocuments.map((file) =>
                    uploadToS3(file, "supportedDocuments")
                )
            )
            : [];
        const imageUrls = files?.images
            ? await Promise.all(
                files?.images.map(async (file) => uploadToS3(file, "images"))
            )
            : [];
        const patentData = {
            title: body.title,
            owner: body.owner,
            submissionDate: body.submissionDate,
            filingDate: body.filingDate,
            priorityDate: body.priorityDate,
            assignee: body.assignee,
            description: body.description,
            category: body.patentClassification,
            priorArtReferences: body.priorArtReferences,
            type: body.type,
            status: body.status,
            supportedDocuments: supportedDocumentsUrls,
            verifiedBySME: body.verifiedBySME === "true" ? "requested" : "false",
            images: imageUrls,
        };
        //console.log(patentData);
        const patent = new PatentModel(patentData);
        await patent.save();
        if (!patent) {
            return res.status(404).json({ message: "Patent not found" });
        }
        // console.log("Patent updated successfully", patent.supportedDocuments);
        res.status(200).json({ message: "Patent updated successfully", patent });
    } catch (error) {

        //  console.log(error);
        handleErrors(error, res);
    }
}

exports.deletePatent  = async (req,res)=>{

    try{
        console.log(req.params.id);
        const patentId = new mongoose.Types.ObjectId(req.params.id);
        const patent = await PatentModel.findByIdAndDelete(patentId);
        console.log(patent);
        if (!patent) {
            return res.status(404).json({ message: "Patent not found" });
        }
        res.status(200).json({ message: "Patent deleted successfully", patent });
    }catch(err){
        handleErrors(err,res);
    }
}

exports.getOwners = async (req,res)=>{
    try {
        const { owners } = req.body; // Owners should be an array of ObjectIds

        if (!owners || !Array.isArray(owners)) {
            return res.status(400).json({ message: "Invalid owners array" });
        }

        // Convert string IDs to ObjectId format
        const ownerObjectIds = owners.map(id => new mongoose.Types.ObjectId(id));

        // Find users whose _id exists in the owners array
        const users = await UserModel.find({ _id: { $in: ownerObjectIds } }).select("name email");

        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        res.status(200).json(users);
    } catch (error) {
        //console.error("Error fetching users from owners:", error);
        res.status(500).json({ message: "Server error fetching users" });
    }
}

exports.getSMERequests = async (req,res)=>{
    try{
        const patents = await PatentModel.find({ verifiedBySME: "requested" });
        res.status(200).json(patents);
    }catch(err){
        handleErrors(err,res);
    }
};

exports.approveSMERequest = async (req,res)=>{
    try{
        const patentId = new mongoose.Types.ObjectId(req.body.patentId);
        console.log(patentId)
        const patent = await PatentModel.findByIdAndUpdate(patentId, { verifiedBySME: "true" });
        res.status(200).json(patent);
    }catch(err){
        handleErrors(err,res);
    }
};

exports.declineSMERequest = async (req,res)=>{
    try{
        const patentId = new mongoose.Types.ObjectId(req.body.patentId);
        const patent = await PatentModel.findByIdAndUpdate(patentId, { verifiedBySME: "false" });
        console.log("declined");
        res.status(200).json(patent);
    }catch(err){
        handleErrors(err,res);
    }
};
const mongoose = require("mongoose")
const PatentModel = require("../models/Patents")
const multer = require("multer")
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const { getSignedUrl } =require("@aws-sdk/s3-request-presigner")


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyVariable = process.env.ACCESS_KEY_VARIABLE;
const secretAccessKeyVariable = process.env.SECRET_ACCESS_KEY_VARIABLE;


const handleErrors = (err,res)=>{
    console.log(err.message,err.code);
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
            console.log("req received",req);
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
            const patentData = {
                title: body.title,
                submitter: body.submitter,
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
                images: imageUrls,
              };
              const patent = new PatentModel(patentData);
                await patent.save();
                console.log("Patent saved successfully",patent);
                res.status(200).json({ message: "Patent saved successfully", patent });
        }catch(error){
            console.error(error);
            res.status(500).json({
                message: "An error occurred while fetching patent details",
                error: error.message,
              });
              }
    }
]
exports.getPatents = async (req,res) => {
    const name = req.params.submitter;
    try{
        //console.log("Get patent req recieved") 
        const patents = await PatentModel.find({submitter:name});
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
        console.log(patents)
     res.json(patents);

    }catch(error){
        res.json(error);
    }
}
exports.appendPatentFiles = [
    upload.array("supportedDocuments", 10), // Handle multiple file uploads
    async (req, res) => {
      try {
        console.log("req recieved")
        const { patentId } = req.body;
        const {files} = req;
        console.log(files);
        if (!mongoose.Types.ObjectId.isValid(patentId)) {
          return res.status(400).json({ message: "Invalid Patent ID" });
        }
        const patent = await PatentModel.findById(patentId);
        if (!patent) {
          return res.status(404).json({ message: "Patent not found" });
        }
        // const supportedDocumentsUrls = files.supportedDocuments
        //     ? await Promise.all(
        //         files.supportedDocuments.map((file) =>
        //           uploadToS3(file, "supportedDocuments")
        //         )
        //       )
        //     : [];
        const newFilesUrls = files.length
          ? await Promise.all(
              files.map((file) => uploadToS3(file, "supportedDocuments"))
            )
          : [];
        console.log(newFilesUrls);
        patent.supportedDocuments = [...patent.supportedDocuments, ...newFilesUrls];
        console.log(patent.supportedDocuments);
        await patent.save();
        res.status(200).json({
          message: "Files appended successfully",
          patent,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "An error occurred while appending files",
          error: error.message,
        });
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
        res.json({status:"Success",patents});
    }catch(err){
        res.json({status:"FAILED",err});
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
        console.log(patent.supportedDocuments);
        res.json({status:"Success", docs: patent.supportedDocuments});
    }catch(err){
        handleErrors(err,res)
    }
}


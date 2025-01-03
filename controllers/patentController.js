const mongoose = require("mongoose")
const PatentModel = require("../models/Patents")
const multer = require("multer")
const path = require("path");

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/");
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+'-'+file.originalname);
    },
});

const upload = multer ({storage});

exports.addPatent = [
    upload.fields([{
        name:"supportedDocuments",maxCount:10
    },
    {
        name:"images",maxCount:10
    }]),
    async(req,res)=>{
        try{
            const {body,files}=req;
            const patentData = {
                title: body.title,
                submitter: body.submitter,
                submissionDate: body.submissionDate,
                filingDate: body.filingDate,
                priorityDate: body.priorityDate,
                assignee: body.assignee,
                description: body.description,
                category: body.patentClassification,
                priorArtReferences: body.priorArtReferences
                  ? body.priorArtReferences.split(",")
                  : [],
                type: body.type,
                status: body.status,
                supportedDocuments: files.supportedDocuments
                  ? files.supportedDocuments.map((file) => file.path)
                  : [],
                images: files.images ? files.images.map((file) => file.path) : [],
              };
                const patent = new PatentModel(patentData);
                await patent.save();
                res.status(200).json({ message: "Patent saved successfully", patent });
        }catch(error){
            console.error(error);
            res.status(500).json({ error: "Failed to save patent" });
        }
    }
]
exports.getPatents = async (req,res) => {
    const name = req.params.submitter;
    try{
        const patents = await PatentModel.find({submitter:name});
        res.json(patents);
    }catch(error){
        res.json(error);
    }
}


const mongoose = require("mongoose");

const PatentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  owner: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  ownerNames: [
    {
      type: String, // Store corresponding user names
      required: true,
    },
  ],
  assignee: {
    type: String,
    required: true,
  },
  submission_date: {
    type: Date,
    default: Date.now,
  },
  filingDate: {
    type: Date,
    required: true,
  },
  priorityDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Mechanical", "Electrical", "Chemical", "Software", "Biological", "Other"], 
  },
  prior_art_references: {
    type: String,
  },
  price:{
    type: Number,
    default: 299
  },
  type: {
    type: String,
    required: true,
    enum: ["Utility", "Design", "Plant", "Other"], 
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Approved", "Rejected"], 
  },
  verifiedBySME:{
    type:String,
    default : "false", 
  },
  supportedDocuments: [
    {
      type: String, 
    },
  ],
  images: [
    {
      type: String,
    },
  ],
}, { timestamps: true },
); 

const Patent = mongoose.model("Patent", PatentSchema);

module.exports = Patent;
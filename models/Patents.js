const mongoose = require("mongoose");

// Define the schema for a Patent
const PatentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  submitter: {
    type: String,
    required: true,
  },
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
    type: [String],
  },
  price:{
    type: Number,
    default: 299
  },
  type: {
    type: String,
    required: true,
    enum: ["Utility", "Design", "Plant", "Other"], // Example types
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Approved", "Rejected"], // Example statuses
  },
  supportedDocuments: [
    {
      type: String, // URLs or file paths for the documents
    },
  ],
  images: [
    {
      type: String, // URLs or file paths for the images
    },
  ],
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

const Patent = mongoose.model("Patent", PatentSchema);

module.exports = Patent;
const mongoose = require("mongoose");

const PartySchema = new mongoose.Schema({
  patentId: { type: mongoose.Schema.Types.ObjectId, ref: "Patent", required: true }, // Links party to a specific patent
  buyers: [
    {
      buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Buyer who is part of the party
      status: { 
        type: String, 
        required: true, 
        enum: ["pending", "approved", "reqSent", "declined"] 
      }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Party = mongoose.model("Party", PartySchema);
module.exports = Party;

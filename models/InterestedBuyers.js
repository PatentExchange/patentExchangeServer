const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BuyerSchema = new mongoose.Schema(
    {
      name: String,
      org: String,
      purposeOfPurchase: String,
      email: String,
      phone: String,
      address: String,
      status: { type: String, default: "pending" },
    },
    { _id: false } // ❌ Prevents automatic _id generation for buyers
  );
  
  const InterestedBuyerSchema = new mongoose.Schema({
    patentId: { type: mongoose.Schema.Types.ObjectId, ref: "Patent" },
    buyers: [BuyerSchema] // Embedded array without _id
  });

module.exports = mongoose.model('InterestedBuyer', InterestedBuyerSchema);
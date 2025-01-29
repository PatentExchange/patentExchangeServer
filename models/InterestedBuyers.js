const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const InterestedBuyerSchema = new Schema({
    patentId: Schema.Types.ObjectId,
    buyers: [{
        name: String,
        org: String,
        purposeOfPurchase: String,
        email: String,
        phone: String,
        address: {
            type: String,
            required: false
        },
        status: {type: String,
             default : "pending"
        }
    }]
});

module.exports = mongoose.model('InterestedBuyer', InterestedBuyerSchema);
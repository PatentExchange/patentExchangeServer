const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const InterestedBuyerSchema = new Schema({
    patentId:Schema.Types.ObjectId,
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('InterestedBuyer', InterestedBuyerSchema);
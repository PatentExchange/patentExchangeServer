const mongoose = require('mongoose');

//buyer
//seller
//patent
// transferStatus
const Schema = mongoose.Schema;

const transferSchema = new Schema({
    buyer: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    sellers: [{ type: Schema.Types.ObjectId, ref: 'Users', required: true }],
    patent: { type: Schema.Types.ObjectId, ref: 'Patent', required: true },
    transferStatus: { type: String, enum: ['pending', 'completed', 'withdrawn'], default: 'pending' }
});
transferSchema.index({ buyer: 1, seller: 1, patent: 1 }, { unique: true });
module.exports = mongoose.model('Transfer', transferSchema);
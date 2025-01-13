const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    orderID:{type:Number, required:true, unique:true},
    orderQuantity:{type:Number, required:true, min:1},
    userId:{type:String, required:true},
    patentsOrdered: {type: String,required:true},
    orderDate:{type:String},
    paymentMode:{type:String, default: Date.now, enum: ["UPI", "Credit Card/Debit Card", "Cash on Delivery"], default: "UPI"},
    orderPrice:{type:Number},
    // shippingAddress:{type:String},
    // name:{type:String, required:true},
    // contactNumber:{type:Number, required:true, },
    // orderID:{type:Number, required:true, unique:true},
    // orderQuantity:{type:Number, required:true, min:1},
    // orderDate:{type:Date, default:Date.now},
    // patentTitle:{type:String},
    // requestEmail:{type:String},
    // deliveryEmail:{type:String, required: true},
    // licensor:{type:String},
    // licensee:{type:String},
    // paymentMode:{type:String, default: Date.now, enum: ["UPI", "Credit Card/Debit Card", "Cash on Delivery"], default: "Cash on Delivery"},
    // transactionRefNum:{type:Number, default: 12122002},
    // amountForEach:{type:Number, min: 0},
    // totalAmount:{type:Number, min: 0},
    // billPdf:{type:mongoose.Schema.Types.Mixed}, //used to store metadata or file data

    //Optional fields

    //billingAddress:{type:String},
    //deliveryMethod:{type:String, enum:["Digital", "Physical"]}

});

const orderModel = mongoose.model("Orders", orderSchema);
module.exports = orderModel;

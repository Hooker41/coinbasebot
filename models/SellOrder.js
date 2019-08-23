const mongoose = require('mongoose');

const { Schema } = mongoose;

const SellOrder = new Schema({
  botID: String,
  orderID: String,
  status: String,
  doneReason: String,
  doneAt: Number,
  filledSize: Number,
  executedValue: Number,
  buyOrderID: {
    type: String,
    default: ''
  },
  boughtPrice: Number,
  profit: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var SellOrderSchema =  mongoose.model('SellOrder', SellOrder);

module.exports = SellOrderSchema;
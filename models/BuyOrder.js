const mongoose = require('mongoose');

const { Schema } = mongoose;

const BuyOrder = new Schema({
  botID: String,
  orderID: String,
  status: String,
  doneReason: String,
  doneAt: Number,
  filledSize: Number,
  executedValue: Number,
  sellOrderID: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var BuyOrderSchema =  mongoose.model('BuyOrder', BuyOrder);

module.exports = BuyOrderSchema;
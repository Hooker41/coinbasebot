const mongoose = require('mongoose');

const { Schema } = mongoose;

const History = new Schema({
  botID: String,
  type: String,
  price: Number,
  amount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var HistorySchema =  mongoose.model('History', History);

module.exports = HistorySchema;
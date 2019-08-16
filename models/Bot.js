const mongoose = require('mongoose');

const { Schema } = mongoose;

const Bot = new Schema({
  name: String,
  buyRule: {
    increaseAmount: Number,
    increaseMin: Number,
    increaseBuyAmount: Number,
    decreaseAmount: Number,
    decreaseMin: Number
  },
  sellRule: {
    increaseAmount: Number
  },
  pauseRule: {
    increaseAmount: Number
  },
  cbInfo: {
    key: String,
    secret: String,
    passphrase: String
  },
  net: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var BotSchema =  mongoose.model('Bot', Bot);

module.exports = BotSchema;
const mongoose = require('mongoose');

const { Schema } = mongoose;

const Bot = new Schema({
  name: String,
  state: {
    type: String,
    default: 'Waiting to buy'
  },
  buyRule: {
    increaseAmount: {
      type: Number,
      default: -1
    },
    increaseMin: {
      type: Number,
      default: -1
    },
    increaseBuyAmount: {
      type: Number,
      default: -1
    },
    decreaseAmount: {
      type: Number,
      default: -1
    },
    decreaseMin: {
      type: Number,
      default: -1
    },
    decreaseBuyAmount: {
      type: Number,
      default: -1
    },
  },
  sellRule: {
    increaseAmount: {
      type: Number,
      default: -1
    }
  },
  pauseRule: {
    abovePrice: {
      type: Number,
      default: -1
    }
  },
  cbInfo: {
    key: String,
    secret: String,
    passphrase: String
  },
  lastBoughtPrice: {
    type: Number,
    default: 0
  },
  net: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var BotSchema =  mongoose.model('Bot', Bot);

module.exports = BotSchema;
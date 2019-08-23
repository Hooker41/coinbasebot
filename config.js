const mongoose = require('mongoose');

//MongoDB configuration & connection
const mongoDB = {
  url:'mongodb://localhost:27017/bot87',
  config: {
    config: { autoIndex: false }
  },
  connection:function(){
    let self=this;
    mongoose.connect(this.url, this.config)
    mongoose.connection.on('connected', function () {
      mongoose.set('useFindAndModify', false);
      console.log('Mongoose connection open to ' + self.url);
    });
    mongoose.connection.on('error',function (err) {
      console.log('Mongoose connection error: ' + err);
    });
    mongoose.connection.on('disconnected', function () {
      console.log('Mongoose connection disconnected');
    });
    return mongoose;
  }
}

exports.mongoDB = mongoDB;
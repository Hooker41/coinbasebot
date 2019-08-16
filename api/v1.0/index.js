const express = require('express');
const router = express.Router();
const Bot = require('../../models/Bot');
const History = require('../../models/History');
const CoinbasePro = require('coinbase-pro');
const apiURI = 'https://api.pro.coinbase.com';
router.post('/createNewBot', async function(req, res){
  let params = req.body;
  let data = {
    name: params.botName,
    buyRule: {
      increaseAmount: params.buyIncAmt,
      increaseMin: params.buyIncMin,
      increaseBuyAmount: params.buyAmt,
      decreaseAmount: params.buyDecAmt,
      decreaseMin: params.buyDecMin
    },
    sellRule: {
      increaseAmount: params.sellIncAmt
    },
    pauseRule: {
      increaseAmount: params.pauseOverPrice
    },
    cbInfo: {
      key: params.apikey,
      secret: params.apisecret,
      passphrase: params.apipass
    }
  };

  const authedClient = new CoinbasePro.AuthenticatedClient(
    params.apikey,
    params.apisecret,
    params.apipass,
    apiURI
  );
  let isAuthed = await checkAuth(authedClient);
  if (isAuthed.success){
    let result = await Bot.create(data);
    if (!result._id){
      req.session.sessionFlash = {
        message: "Can't create bot"
      }
    }
  } else {
    req.session.sessionFlash = {
      message: isAuthed.message
    }
  }
  res.redirect(301, '/');
});
function checkAuth(authedClient){
  return new Promise((resolve)=>{
    authedClient.getCoinbaseAccounts(function(error, response, data){
      if (error == null){
        resolve({
          success: true
        });
      } else {
        resolve({
          success: false,
          message: error.data.message
        });
      }
    });
  })
}
router.get('/getBots', async function(req, res){
  let result = await Bot.find({});
  res.json(result);
});

router.post('/addHistory', async function(req, res){
  let record = req.body.record;
  let result = await History.create(record);
  if (result._id){
    res.json({success: true});
  } else {
    res.json({success: false});
  }
})
module.exports = router;
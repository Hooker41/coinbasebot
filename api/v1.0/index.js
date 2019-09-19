const express = require('express');
const router = express.Router();
const Bot = require('../../models/Bot');
const BuyOrder = require('../../models/BuyOrder');
const SellOrder = require('../../models/SellOrder');
const CoinbasePro = require('coinbase-pro');
const apiURI = 'https://api.pro.coinbase.com';
const {checkBalance} = require('../../lib/balance');
router.post('/createNewBot', async function(req, res){
  let params = req.body;
  let data = {
    name: params.botName,
    buyRule: {
      increaseAmount: params.incAmt,
      increaseMin: params.incMin,
      increaseBuyAmount: params.incBuyAmt,
      decreaseAmount: params.decAmt,
      decreaseMin: params.decMin,
      decreaseBuyAmount: params.decBuyAmt
    },
    buyNowRule:{
      active: params.buyNowSwitch ? true : false,
      buyNowAmt: params.buyNowAmt,
      passed: false
    },
    sellRule: {
      increaseAmount: params.sellIncAmt
    },
    pauseRule: {
      abovePrice: params.pauseOverPrice
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
  let isAuthed = await checkBalance(authedClient);
  if (isAuthed.success){
    const balance = isAuthed.balance;
    const buyNowRule = data.buyNowRule;
    const isBuyNow = buyNowRule.active;
    const buyNowAmt = buyNowRule.buyNowAmt;
    if (isBuyNow && buyNowAmt > 0){
      data.state = 'Waiting to buy'
    } else if ((params.incBuyAmt > 0 &&  balance > params.incBuyAmt) ||
      (params.decBuyAmt > 0 && balance > params.decBuyAmt)){
      data.state = 'Waiting to buy'
    } else {
      data.state = 'Paused'
    }
    data.net = 0
    let result = await Bot.create(data);
    if (!result._id){
      req.session.sessionFlash = {
        message: "Saving Bot in database failed!"
      }
    }
  } else {
    req.session.sessionFlash = {
      message: isAuthed.message
    }
  }
  res.redirect(301, '/');
});
router.get('/getBots', async function(req, res){
  let result = await Bot.find({});
  res.json(result);
});
router.post('/getBotInfo', async function(req, res){
  const botID = req.body.botID;
  let botInfo = await Bot.findOne({_id: botID});
  res.json(botInfo);
});
router.post('/modifyBot', async function(req, res){
  let params = req.body;
  const botID = params.botid;
  const bot = await Bot.findOne({_id: botID});
  let data = {
    name: params.botName,
    buyRule: {
      increaseAmount: params.incAmt,
      increaseMin: params.incMin,
      increaseBuyAmount: params.incBuyAmt,
      decreaseAmount: params.decAmt,
      decreaseMin: params.decMin,
      decreaseBuyAmount: params.decBuyAmt
    },
    buyNowRule:{
      active: params.buyNowSwitch ? true : false,
      buyNowAmt: params.buyNowAmt,
      passed: bot.buyNowRule.passed
    },
    sellRule: {
      increaseAmount: params.sellIncAmt
    },
    pauseRule: {
      abovePrice: params.pauseOverPrice
    },
    cbInfo: {
      key: params.apikey,
      secret: params.apisecret,
      passphrase: params.apipass
    }
  };
  let result = await Bot.findOneAndUpdate({_id: botID}, {$set: data});
  res.redirect(301, '/');
});

router.post('/changeState', async function(req, res){
  const botID = req.body.botID;
  let botInfo = await Bot.findOne({_id: botID});
  let state = botInfo.state;
  if (state == 'Paused'){
    const authedClient = new CoinbasePro.AuthenticatedClient(
      botInfo.cbInfo.key,
      botInfo.cbInfo.secret,
      botInfo.cbInfo.passphrase,
      apiURI
    );
    let isAuthed = await checkBalance(authedClient);
    let balance = 0;
    if (isAuthed){
      balance = isAuthed.balance
    }
    //change state to buy/sell
    const boughtsToSell = await BuyOrder.findOne({botID, sellOrderID: ''});
    if (boughtsToSell){
      state = 'Waiting to sell';
    } else {
      const buyRule = botInfo.buyRule;
      const buyNowRule = botInfo.buyNowRule;
      const isBuyNow = buyNowRule.active;
      const buyNowAmt = buyNowRule.buyNowAmt;
      const passed = buyNowRule.passed;
      if (isBuyNow && !passed && buyNowAmt > 0){
        state = 'Waiting to buy';
      } else if ((buyRule.increaseBuyAmount > 0  && balance > buyRule.increaseBuyAmount) ||
        (buyRule.decreaseBuyAmount > 0 && balance > buyRule.decreaseBuyAmount)){
        state = 'Waiting to buy';
      }
    }
  } else {
    state = 'Paused';
  }
  await Bot.findOneAndUpdate({_id: botID}, {$set: {state}});
  res.json({
    state,
    lastBoughtPrice: botInfo.lastBoughtPrice
  });
});

router.post('/getProfits', async function(req, res){
  const botID = req.body.botid;
  const sold = await SellOrder.find({botID});
  let profitAry = [];
  sold.map((item)=>profitAry.push([item.doneAt * 1000, item.profit]));
  res.json({
    result: profitAry
  });
});
router.get('/getStatus', async function(req, res){
  const bots = await Bot.find({});
  let status={};
  for (let i in bots){
    const bot = bots[i];
    const botid = bot._id;
    const state = bot.state;
    const lastboughtprice = bot.lastBoughtPrice;
    status[botid] = [state, lastboughtprice];
  }
  res.json(
    status
  );
});
router.post('/getBotHistory', async function(req, res){
  let botID = req.body.botID;
  const sold = await SellOrder.find({botID});
  let tabledata = [];
  sold.map((item)=>{
    const date = item.doneAt * 1000;
    const boughtPrice = item.boughtPrice;
    const soldPrice = parseFloat(item.executedValue / item.filledSize).toFixed(2);
    const profit = item.profit;
    const margin = (soldPrice / boughtPrice - 1) * 100;
    const filledSize = item.filledSize;
    tabledata.push([date, filledSize, boughtPrice, soldPrice, profit, margin]);
  });
  res.json({
    tabledata
  });
});
router.get('/getAllProfits', async function(req, res){
  const sold = await SellOrder.find({});
  let tabledata = [];
  sold.map((item)=>{
    const date = item.doneAt * 1000;
    const profit = item.profit;
    tabledata.push([date, profit]);
  });
  res.json({
    tabledata
  });
});

router.post('/delete', async function(req, res){
  let botID = req.body.botID;
  await Bot.deleteOne({_id: botID})
  res.end();
});
module.exports = router;
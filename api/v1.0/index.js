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
  let isAuthed = await checkBalance(authedClient);
  if (isAuthed.success){
    const balance = isAuthed.balance;
    if (balance > params.buyAmt){
      data.state = 'Waiting to buy'
    } else {
      data.state = 'Paused'
    }
    data.net = balance
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
    if (balance > botInfo.buyRule.increaseBuyAmount){
      //change state to buy/sell
      const boughtsToSell = await BuyOrder.findOne({botID, sellOrderID: ''});
      if (boughtsToSell){
        state = 'Waiting to sell';
      } else {
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

router.get('/getProfits', async function(req, res){
  const bots = await Bot.find({});
  let result = {};
  for (let i in bots){
    const bot = bots[i];
    const botID = bot._id;
    const sold = await SellOrder.find({botID});
    let profitAry = [];
    sold.map((item)=>profitAry.push([item.doneAt * 1000, item.profit]));
    result[bot._id] = profitAry;
  }
  res.json(
    result
  );
});

router.get('/getBalances', async function(req, res){
  const bots = await Bot.find({});
  let balances={};
  for (let i in bots){
    const bot = bots[i];
    const botid = bot._id;
    const authInfo = bot.cbInfo;
    const authedClient = new CoinbasePro.AuthenticatedClient(
      authInfo.key,
      authInfo.secret,
      authInfo.passphrase,
      apiURI
    );
    const result = await checkBalance(authedClient);
    if (result.success){
      const balance = result.balance;
      balances[botid] = balance;
    }
  }
  res.json(
    balances
  );
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
    tabledata.push([date, boughtPrice, soldPrice, profit, margin]);
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
module.exports = router;
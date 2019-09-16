const Bot = require('../models/Bot');
const BuyOrder = require('../models/BuyOrder');
const SellOrder = require('../models/SellOrder');
const CoinbasePro = require('coinbase-pro');
const apiURI = 'https://api.pro.coinbase.com';
const publicClient = new CoinbasePro.PublicClient(apiURI);

const {checkOrders} = require('./orders');
const {checkBalance} = require('./balance');
let rateBTCUSD60 = [];
let lastPrice = 0;

const websocket = new CoinbasePro.WebsocketClient(
  ['BTC-USD'],
  'wss://ws-feed.pro.coinbase.com',
  {
    key: 'dc8b80633631aa783b16052af9545250',
    secret: 'yL+1MPAd2CaZ+gz//XKEYXbAU38Iinn3+HBo2gqlOFpmVMhg0Ce3qNvIG/nTih9yqi7eQMAKdzaL5WQr3OFKXw==',
    passphrase: 'd6rcb6unl9i',
  },
  { channels: ['ticker'] }
);
websocket.on('message', data => {
  if (data.type == 'ticker'){
    lastPrice = data.price;
    console.log('lastPrice', lastPrice);
  }
  /* work with data */
});
websocket.on('error', err => {
  /* handle error */
  setTimeout(function() {
    websocket.connect();
  }, 1000);
});
websocket.on('close', () => {
  /* ... */
});

const run = async () => {
  getBTCUSD();
  checkOrders();
  checkBuyRules();
  checkSellRules();
}
const checkPauseRules = async() => {
  const bots = await Bot.find({state: 'Waiting to buy'});
  for (let j in bots){
    const bot = bots[j];
    const botID = bot._id;
    const abovePrice = bot.pauseRule.abovePrice;
    if (abovePrice > -1 && lastPrice >= abovePrice){
      await Bot.findOneAndUpdate({_id: botID}, {$set: {state: 'Paused'}});
    }
  }
  setTimeout(() => {
    checkPauseRules();
  }, 2000);
}
const checkBuyRules = async() => {
  if (rateBTCUSD60.length > 0){
    const bots = await Bot.find({state: 'Waiting to buy'});
    for (let j = 0; j < bots.length; j++){
      const bot = bots[j];
      const buyNowRule = bot.buyNowRule;
      const isBuyNow = buyNowRule.active;
      const buyNowAmt = buyNowRule.buyNowAmt;
      const passed = buyNowRule.passed;
      if (isBuyNow && !passed){
        if (buyNowAmt <= 10 ){
          console.log(bot.name, "can't buy less than $10 buyNowRule");
          await Bot.findOneAndUpdate({_id: bot._id}, {$set: {state: 'Paused'}});
          continue;
        }
        console.log('buy now rule');
        // first buy
        await buy(bot, buyNowAmt);
        const newBuyNowRule = {
          active: isBuyNow,
          buyNowAmt,
          passed: true
        }
        await Bot.findOneAndUpdate({_id: bot._id}, {$set: {buyNowRule: newBuyNowRule}});
      } else {
        console.log('1, 2 buy rules');
        const buyRule = bot.buyRule;
        // buy when increase
        const incAmount = buyRule.increaseAmount;
        let incMin = buyRule.increaseMin;
        const incBuyAmount = buyRule.increaseBuyAmount;
        const decAmount = buyRule.decreaseAmount;
        const decMin = buyRule.decreaseMin;
        const decBuyAmount = buyRule.decreaseBuyAmount;
        if ((incAmount <= 0 || incMin <= 0 || incBuyAmount <= 10) && (decAmount <= 0 || decMin <= 0 || decBuyAmount <= 10)){
          await Bot.findOneAndUpdate({_id: bot._id}, {$set: {state: 'Paused'}});
          continue;
        }
        if (incAmount > 0 && incMin > 0 && incBuyAmount > 10){
          console.log('inc buy rule');
          const incMilli = incMin * 60000;
          let currentMillli = new Date().getTime();
          let agoMilli = currentMillli - incMilli;
          agoMilli = agoMilli - agoMilli % 300000;
          let minAgo = parseInt(agoMilli / 1000);
          const item = rateBTCUSD60.find((item)=>item[0] == minAgo);
          if (item && lastPrice > 0){
            const changeForInc = lastPrice - item[4];
            console.log(changeForInc+' increased in '+incMin+'min buy amount '+incBuyAmount);
            if (changeForInc >= incAmount){
              // buy
              await buy(bot, incBuyAmount);
            }
          }
        }
        if (decAmount > 0 && decMin > 0 && decBuyAmount > 10){
          console.log('dec buy rule');
          // buy when decrease
          const currentMin = new Date().getMinutes();
          let minAgo = new Date().setMinutes(currentMin - parseInt(decMin), 0, 0);
          minAgo = parseInt(minAgo/1000);
          const item = rateBTCUSD60.find((item)=>item[0] == minAgo);
          if (item && lastPrice > 0){
            const changeForDec = item[4] - lastPrice;
            console.log(changeForDec+' decreased in '+decMin+'min buy amount '+decBuyAmount);
            if (changeForDec > decAmount){
              // buy
              await buy(bot, decBuyAmount);
            }
          }
        }
      }
    }
  }
  setTimeout(() => {
    checkBuyRules();
  }, 2000);
}
const buy = async(bot, amount) => {
  const botID = bot._id;
  const authInfo = bot.cbInfo;
  const authedClient = new CoinbasePro.AuthenticatedClient(
    authInfo.key,
    authInfo.secret,
    authInfo.passphrase,
    apiURI
  );
  let result = await checkBalance(authedClient);
  if (result.success && result.balance > amount && amount > 10){
    console.log('make buy order', botID);
    const buyParams = {
      type: 'market',
      product_id: 'BTC-USD',
      funds: amount
    };
    const boughtResult = await authedClient.buy(buyParams);
    console.log({boughtResult, buyParams});
    // const boughtResult={
    //   id: '1afcd15e-7c23-40e9-a558-c611a05f48b0',
    //   product_id: 'BTC-USD',
    //   side: 'buy',
    //   stp: 'dc',
    //   funds: '9.9750623400000000',
    //   specified_funds: '10.0000000000000000',
    //   type: 'market',
    //   post_only: false,
    //   created_at: '2019-08-22T12:24:33.644813Z',
    //   fill_fees: '0.0000000000000000',
    //   filled_size: '0.00000000',
    //   executed_value: '0.0000000000000000',
    //   status: 'pending',
    //   settled: false
    // }
    // const boughtResult = {
    //   id: 'edcc122f-4526-4588-bfc8-6440fd29ea99',
    //   product_id: 'BTC-USD',
    //   side: 'buy',
    //   stp: 'dc',
    //   funds: '19.9501246800000000',
    //   specified_funds: '20.0000000000000000',
    //   type: 'market',
    //   post_only: false,
    //   created_at: '2019-08-22T14:38:10.644516Z',
    //   fill_fees: '0.0000000000000000',
    //   filled_size: '0.00000000',
    //   executed_value: '0.0000000000000000',
    //   status: 'pending',
    //   settled: false
    // };
    // const boughtResult = {
    //   id: '5c64f300-1f31-4b2b-99ad-41c73cf7d944',
    //   product_id: 'BTC-USD',
    //   side: 'buy',
    //   stp: 'dc',
    //   funds: '19.9501246800000000',
    //   specified_funds: '20.0000000000000000',
    //   type: 'market',
    //   post_only: false,
    //   created_at: '2019-08-22T15:13:21.016956Z',
    //   fill_fees: '0.0000000000000000',
    //   filled_size: '0.00000000',
    //   executed_value: '0.0000000000000000',
    //   status: 'pending',
    //   settled: false
    // };
    // change bot state to waiting to sell
    await Bot.findOneAndUpdate({_id: botID}, {$set: {state: 'Waiting to sell'}});
    // make bought history
    await BuyOrder.create({
      botID,
      orderID: boughtResult.id,
      status: boughtResult.status,
      filled_size: parseFloat(boughtResult.filled_size)
    });
  } else {
    // insufficient balance
    console.log("can't buy insufficient balance");
    await Bot.findOneAndUpdate({_id: botID}, {$set: {state: 'Paused'}});
  }
}
const checkSellRules = async() => {
  const bots = await Bot.find({state: 'Waiting to sell'});
  if (bots.length > 0){
    for (let j = 0; j < bots.length; j++){
      let bot = bots[j];
      const boughtOrder = await BuyOrder.findOne({botID: bot._id, status:'done', doneReason:'filled', sellOrderID: ''});
      if (boughtOrder){
        const boughtPrice = boughtOrder.executedValue / boughtOrder.filledSize;
        const sellRule = bot.sellRule;
        if (sellRule.increaseAmount <= 0){
          await Bot.findOneAndUpdate({_id: bot._id}, {$set: {state: 'Paused'}});
          continue;
        }
        const sellTargetPrice = boughtPrice + sellRule.increaseAmount;
        // console.log({boughtPrice, sellTargetPrice, lastPrice});
        if (lastPrice >= sellTargetPrice){
          // sell
          await sell(bot, boughtOrder.filledSize, boughtOrder);
        }
      }
    }
  }
  setTimeout(() => {
    checkSellRules()
  }, 2000);
}
const sell = async(bot, amount, boughtOrder) => {
  const botID = bot._id;
  const authInfo = bot.cbInfo;
  const authedClient = new CoinbasePro.AuthenticatedClient(
    authInfo.key,
    authInfo.secret,
    authInfo.passphrase,
    apiURI
  );
  if (authedClient){
    console.log('make sell order', botID);
    const sellParams = {
      type: 'market',
      product_id: 'BTC-USD',
      size: amount
    };
    const soldResult = await authedClient.sell(sellParams);
    console.log({soldResult, sellParams});
    // const soldResult={
    //   id: '42846337-53aa-4d99-bc94-d9e5681a6adf',
    //   size: '0.00197245',
    //   product_id: 'BTC-USD',
    //   side: 'sell',
    //   stp: 'dc',
    //   type: 'market',
    //   post_only: false,
    //   created_at: '2019-08-22T15:41:40.072919Z',
    //   fill_fees: '0.0000000000000000',
    //   filled_size: '0.00000000',
    //   executed_value: '0.0000000000000000',
    //   status: 'pending',
    //   settled: false
    // }
    // const soldResult = {
    //   id: '367cc3a1-e400-4fbc-9fcb-ed6d964d8c71',
    //   size: '0.00197245',
    //   product_id: 'BTC-USD',
    //   side: 'sell',
    //   stp: 'dc',
    //   type: 'market',
    //   post_only: false,
    //   created_at: '2019-08-22T15:41:40.500103Z',
    //   fill_fees: '0.0000000000000000',
    //   filled_size: '0.00000000',
    //   executed_value: '0.0000000000000000',
    //   status: 'pending',
    //   settled: false
    // }
    // change bot state to waiting to sell
    await Bot.findOneAndUpdate({_id: botID}, {$set: {state: 'Waiting to buy'}});
    // make bought history
    const sold = await SellOrder.create({
      botID,
      orderID: soldResult.id,
      status: soldResult.status,
      filled_size: parseFloat(soldResult.filled_size),
      buyOrderID: boughtOrder._id
    });
    await BuyOrder.findOneAndUpdate({_id: boughtOrder._id}, {$set: {sellOrderID: sold._id}});
    console.log('finished------------------------------------------------------------');
  }
}

const getBTCUSD = async() => {
  rateBTCUSD60 = await publicClient.getProductHistoricRates('BTC-USD', { granularity: 300 });
  console.log(rateBTCUSD60.length);
  setTimeout(() => {
    getBTCUSD();
  }, 4000);
}

exports.run = run;
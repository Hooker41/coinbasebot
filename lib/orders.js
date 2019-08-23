const CoinbasePro = require('coinbase-pro');
const apiURI = 'https://api.pro.coinbase.com';
const Bot = require('../models/Bot');
const BuyOrder = require('../models/BuyOrder');
const SellOrder = require('../models/SellOrder');

const checkOrders = async () => {
  const buyOrders = await BuyOrder.find({status: 'pending'});
  for (let i in buyOrders){
    const order = buyOrders[i];
    const orderID = order.orderID;
    const botID = order.botID;
    const bot = await Bot.findOne({_id: botID});
    const authInfo= bot.cbInfo;
    const authedClient = new CoinbasePro.AuthenticatedClient(
      authInfo.key,
      authInfo.secret,
      authInfo.passphrase,
      apiURI
    );
    const orderStatus = await authedClient.getOrder(orderID);
    console.log('bought order checking', orderStatus.id, orderStatus);
    if (orderStatus){
      let doneAt = new Date(orderStatus.done_at).setSeconds(0);
      doneAt = parseInt(doneAt / 1000);
      let filledSize = parseFloat(orderStatus.filled_size);
      let executedValue = parseFloat(orderStatus.executed_value);
      let lastBoughtPrice = parseFloat(executedValue / filledSize).toFixed(2);
      await Bot.findOneAndUpdate({_id: botID}, {lastBoughtPrice});
      let result = await BuyOrder.findOneAndUpdate({orderID},{$set:{
        status: orderStatus.status,
        doneReason: orderStatus.done_reason,
        doneAt,
        filledSize,
        executedValue
      }});
    }
  }
  const sellOrders = await SellOrder.find({status: 'pending'});
  for (let i in sellOrders){
    const order = sellOrders[i];
    const orderID = order.orderID;
    const botID = order.botID;
    const bot = await Bot.findOne({_id: botID});
    const authInfo= bot.cbInfo;
    const authedClient = new CoinbasePro.AuthenticatedClient(
      authInfo.key,
      authInfo.secret,
      authInfo.passphrase,
      apiURI
    );
    const orderStatus = await authedClient.getOrder(orderID);
    console.log('sold order checking', orderStatus.id, orderStatus);
    if (orderStatus){
      let filledSize = parseFloat(orderStatus.filled_size);
      let executedValue = parseFloat(orderStatus.executed_value);
      const buyOrder = await BuyOrder.findOne({_id: order.buyOrderID});
      const boughtPrice = parseFloat(buyOrder.executedValue / buyOrder.filledSize).toFixed(2);
      let doneAt = new Date(orderStatus.done_at).getTime();
      const profit = executedValue - buyOrder.executedValue;
      doneAt = parseInt(doneAt / 1000);
      await SellOrder.findOneAndUpdate({orderID},{$set:{
        status: orderStatus.status,
        doneReason: orderStatus.done_reason,
        doneAt,
        filledSize,
        executedValue,
        profit,
        boughtPrice
      }});
    }
  }
  setTimeout(() => {
    checkOrders()
  }, 4000);
}

exports.checkOrders = checkOrders;
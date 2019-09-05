///////////////////////////////////////////////
// Get coinbase BTCUSD data
///////////////////////////////////////////////
let btcusdInterval = undefined;
function currencyFormat(num) {
  return '$' + parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
function getBTCUSD(granularity){
  if (btcusdInterval){
    clearInterval(btcusdInterval);
  }
  btcusdInterval = setInterval(() => {
    $.get('https://api.pro.coinbase.com/products/btc-usd/candles', {granularity}, function(result){
      result = result.slice(0, 100);
      let data = [];
      for (let i in result){
        let ele = result[i];
        data.push({
          t: ele[0] * 1000,
          y: ele[4]
        })
      }
      var dataset = btcchart.config.data.datasets[0];
      dataset.data = data;
      btcchart.update();

      $('span#btc-label').text(currencyFormat(result[0][4]));
    });
  }, 5000);
}
getBTCUSD(3600);
$('input[type=radio][name="tf_btcusd"]').change(function() {
  let granularity = parseInt(this.value);
  getBTCUSD(granularity);
});
///////////////////////////////////////////////
// Show BTC-USD chart
///////////////////////////////////////////////
Chart.plugins.register({
  beforeDraw: function(chartInstance, easing) {
    var ctx = chartInstance.chart.ctx;
    ctx.fillStyle = 'white'; // your color here

    var chartArea = chartInstance.chartArea;
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
  }
});

var ctx = document.getElementById('btcChart').getContext('2d');
var cfg = {
  type: 'bar',
  data: {
    datasets: [{
      backgroundColor: 'white',
      borderColor: 'blue',
      // data: generateData(),
      type: 'line',
      pointRadius: 0,
      fill: false,
      lineTension: 0,
      borderWidth: 2
    }]
  },
  options: {
    legend: {
			display: false,
		},
    scales: {
      xAxes: [{
        gridLines: {
          // color: 'white',
          display: false
        },
        type: 'time',
        distribution: 'series',
        // ticks: {
        //   source: 'data',
        //   autoSkip: true,
        //   fontColor: 'white',
        // }
      }],
      yAxes: [{
        position: 'right',
        ticks:{
          // fontColor: 'white',
          display: false,
        },
        gridLines: {
          // color: 'white',
          display: false
        },
      }]
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      displayColors: false,
      bodyFontSize: 16,
      footerFontColor: '#aaa',
      callbacks: {
        label: function(tooltipItem, myData) {
          const label = currencyFormat(tooltipItem.value);
          return label;
        },
        footer: function(tooltipItem, myData) {
          const current = tooltipItem[0].xLabel;
          return current;
        },
        title: function(tooltipItem, myData) {
          return false;
        }
      }
    }
  }
};
var btcchart = new Chart(ctx, cfg);
///////////////////////////////////////////////
// Show Total Profit Chart
///////////////////////////////////////////////
setInterval(() => {
  $.get('/api/v1.0/getAllProfits', function(res){
    const profits = res.tabledata;
    let data = [];
    let sum = 0;
    for (let i in profits){
      let ele = profits[i];
      sum += ele[1];
      data.push({
        t: ele[0],
        y: ele[1]
      })
    }
    console.log('all profits', data);
    var dataset = profitChart.config.data.datasets[0];
    dataset.data = data;
    profitChart.update();
    $('span#profit-label').text(currencyFormat(sum));
  });
}, 5000);
var profitCtx = document.getElementById('profitChart').getContext('2d');
var profitCfg = {
  type: 'bar',
  data: {
    datasets: [{
      backgroundColor: 'white',
      borderColor: 'blue',
      // data: generateData(),
      type: 'line',
      pointRadius: 0,
      fill: false,
      lineTension: 0,
      borderWidth: 2
    }]
  },
  options: {
    legend: {
			display: false,
		},
    scales: {
      xAxes: [{
        gridLines: {
          display: false
        },
        type: 'time',
        distribution: 'series',
      }],
      yAxes: [{
        position: 'right',
        ticks:{
          display: false,
        },
        gridLines: {
          display: false
        },
      }]
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      displayColors: false,
      bodyFontSize: 16,
      footerFontColor: '#aaa',
      callbacks: {
        label: function(tooltipItem, myData) {
          const label = currencyFormat(tooltipItem.value);
          return label;
        },
        footer: function(tooltipItem, myData) {
          const current = tooltipItem[0].xLabel;
          return current;
        },
        title: function(tooltipItem, myData) {
          return false;
        }
      }
    }
  }
};
var profitChart = new Chart(profitCtx, profitCfg);
///////////////////////////////////////////////
// Show Bot Chart
///////////////////////////////////////////////
var botChartAry = {};
var botsAry = [];
var viewerBot = undefined;
var botCfg = {
  type: 'bar',
  data: {
    datasets: [{
      backgroundColor: 'white',
      borderColor: 'blue',
      type: 'line',
      pointRadius: 0,
      fill: false,
      lineTension: 0,
      borderWidth: 2
    }]
  },
  options: {
    legend: {
			display: false,
		},
    scales: {
      xAxes: [{
        gridLines: {
          display: false
        },
        type: 'time',
        distribution: 'series',
      }],
      yAxes: [{
        position: 'right',
        ticks:{
          display: false,
        },
        gridLines: {
          display: false
        },
      }]
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      displayColors: false,
      bodyFontSize: 16,
      footerFontColor: '#aaa',
      callbacks: {
        label: function(tooltipItem, myData) {
          const label = currencyFormat(tooltipItem.value);
          return label;
        },
        footer: function(tooltipItem, myData) {
          const current = tooltipItem[0].xLabel;
          return current;
        },
        title: function(tooltipItem, myData) {
          return false;
        }
      }
    }
  }
};
$.get('/api/v1.0/getBots', function(res){
  botChartAry={};
  botsAry=res;
  for (let i in res){
    let bot = res[i];
    let _id = bot._id;
    let botName = bot.name;
    let net = bot.net;
    let state = bot.state;
    let checked = state != 'Paused' ? 'checked' : '';
    let newBot = '<div class="card border-light my-3 bot-panel" style="max-width: 30rem;">'+
      '<div class="card-header d-flex justify-content-between bot-header">'+
        '<div>'+
          '<span class="bot-name">'+ botName +'</span>'+
          '<div class="bot-state">'+
            '<span botid="'+_id+'">'+state+'</span>'+
          '</div>'+
        '</div>'+
        '<div class="custom-control custom-switch">'+
          '<input type="checkbox" class="custom-control-input" id="'+_id+'" '+checked+'>'+
          '<label class="custom-control-label" for="'+_id+'"></label>'+
        '</div>'+
        '<div>'+
          'Net : '+
          '<span class="gain-net" botid="'+_id+'">'+currencyFormat(net)+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="card-body">'+
        '<canvas id="canvas_'+_id+'"></canvas>'+
        '<div class="text-center">'+
          '<a href="#!" class="btn btn-primary view" botid="'+_id+'">View</a>'+
          '<a href="#!" class="btn btn-primary modify" botid="'+_id+'">Modify</a>'+
        '</div>'+
      '</div>'+
    '</div>';
    $('div.bots-scroll-panel>div.card-body').append(newBot);
    let canvas = $('canvas#canvas_'+_id);
    var botChart = new Chart(canvas, botCfg);
    // var dataset = botChart.config.data.datasets[0];
    // dataset.data = [];
    // botChart.update();

    botChartAry[_id] = botChart;
  }
});
const viewerCanvas = $('canvas#viewer-chart');
var viewerChart = new Chart(viewerCanvas, botCfg);
///////////////////////////////////////////////
// Get bot profit data
///////////////////////////////////////////////
const getProfits = () => {
  $.get('/api/v1.0/getProfits', function(res){
    console.log('profits', res);
    if (Object.keys(botChartAry).length > 0){
      for (let botid in res){
        let profitAry = res[botid];
        let data = [];
        let profitSum = 0;
        for (let i in profitAry){
          let profit = profitAry[i];
          profitSum += profit[1];
          data.push({
            t: profit[0],
            y: profit[1]
          })
        }
        let botchart = botChartAry[botid];
        if (data.length > 0){
          console.log(data);
          var dataset = botchart.config.data.datasets[0];
          dataset.data = data;
          botchart.update();
        }
        const netspan = $('span[botid="'+botid+'"].gain-net');
        netspan.text(currencyFormat(profitSum));
        if (viewerBot && botid == viewerBot._id){
          var dataset = viewerChart.config.data.datasets[0];
          dataset.data = data;
          viewerChart.update();
        }
      }
    }
    setTimeout(() => {
      getProfits();
    }, 3000);
  });
}
getProfits();
///////////////////////////////////////////////
// Check Status
///////////////////////////////////////////////
const checkStatus=()=>{
  $.get('/api/v1.0/getStatus', function(res){
    // console.log('state', res);
    for (let botid in res){
      const info = res[botid];
      const state = info[0];
      const lastboughtprice = info[1];
      $('div.bot-state span[botid="'+botid+'"]').text(state);
      if (state == 'Waiting to sell'){
        $('div.bot-state span[botid="'+botid+'"]').text(state + ' ($' + lastboughtprice+')' );
      }
      if (viewerBot && botid == viewerBot._id){
        $('span.viewer-state').text(state);
        if (state == 'Waiting to sell'){
          $('span.viewer-state').text(state + ' ($' + lastboughtprice+')' );
        }
      }
      if (state == 'Paused'){
        $('input#'+botid).prop("checked", false);
      }
    }
    setTimeout(() => {
      checkStatus();
    }, 3000);
  });
}
checkStatus();
///////////////////////////////////////////////
// Clicn Add New Bot Button
///////////////////////////////////////////////
$('div.addbot button').on('click', function(){
  $('input[name="botName"]').val('');
  $('input[name="incAmt"]').val('');
  $('input[name="incMin"]').val('');
  $('input[name="incBuyAmt"]').val('');
  $('input[name="decAmt"]').val('');
  $('input[name="decMin"]').val('');
  $('input[name="decBuyAmt"]').val('');
  $('input[name="sellIncAmt"]').val('');
  $('input[name="pauseOverPrice"]').val('');
  $('input[name="apikey"]').val('');
  $('input[name="apisecret"]').val('');
  $('input[name="apipass"]').val('');
  $('input[name="botid"]').val('');
  $('div.bots-scroll-panel').css('display', 'none');
  $('div.addBotPanel').css('display', 'block');
});
///////////////////////////////////////////////
// Cancel Add New Bot
///////////////////////////////////////////////
$('button#addCancel').on('click', function(){
  $('div.bots-scroll-panel').css('display', 'block');
  $('div.addBotPanel').css('display', 'none');
});
///////////////////////////////////////////////
// Click Add New Bot Save button
///////////////////////////////////////////////
$('button#addSave').on('click', function(e){
  e.preventDefault();
  let form = $('form#addbotform');
  const botID = $('input[name="botid"]').val();
  if (botID != ''){
    form.attr('action', '/api/v1.0/modifyBot');
  }
  form.submit();
});
///////////////////////////////////////////////
// Click Bot Modify button
///////////////////////////////////////////////
$(document).on("click", "a.modify" , function() {
  const botID = $(this).attr('botid');
  $.post('/api/v1.0/getBotInfo', {botID}, function(res){
    if (res){
      $('input[name="botName"]').val(res.name);
      $('input[name="incAmt"]').val(res.buyRule.increaseAmount);
      $('input[name="incMin"]').val(res.buyRule.increaseMin);
      $('input[name="incBuyAmt"]').val(res.buyRule.increaseBuyAmount);
      $('input[name="decAmt"]').val(res.buyRule.decreaseAmount);
      $('input[name="decMin"]').val(res.buyRule.decreaseMin);
      $('input[name="decBuyAmt"]').val(res.buyRule.decreaseBuyAmount);
      $('input[name="sellIncAmt"]').val(res.sellRule.increaseAmount);
      $('input[name="pauseOverPrice"]').val(res.pauseRule.abovePrice);
      $('input[name="apikey"]').val(res.cbInfo.key);
      $('input[name="apisecret"]').val(res.cbInfo.secret);
      $('input[name="apipass"]').val(res.cbInfo.passphrase);
      $('input[name="botid"]').val(botID);
      $('div.bots-scroll-panel').css('display', 'none');
      $('div.addBotPanel').css('display', 'block');
    }
  });
});
///////////////////////////////////////////////
// Click Bot View Close button
///////////////////////////////////////////////
$('span#close-viewer').on('click', function(){
  $('div.bot-viewer').css('display', 'none');
});
///////////////////////////////////////////////
// Click Bot View button
///////////////////////////////////////////////
$(document).on("click", "a.view" , function() {
  const botID = $(this).attr('botid');
  const bot = botsAry.find((item)=>item._id == botID);
  viewerBot = bot;
  $('span.viewer-botname').text(bot.name);
  $('div.bot-viewer').css('display', 'flex');
  $.post('/api/v1.0/getBotHistory', {botID}, function(res){
    Date.prototype.formatMMDDYYYY = function(){
      var hours = this.getHours();
      var minutes = this.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return (this.getMonth() + 1) + 
      "/" +  this.getDate() +
      "/" +  this.getFullYear() +
      ' ' + strTime;
    }
    $('tbody.historytable tr').remove();
    const data = res.tabledata;
    data.map((item)=>{
      const date = new Date(item[0]).formatMMDDYYYY();
      const boughtPrice = '$' + item[1];
      const soldPrice = '$' + item[2];
      const profit = '$' + parseFloat(item[3]).toFixed(4);
      const margin = parseFloat(item[4]).toFixed(2) + '%';
      $('tbody.historytable').append(
        '<tr>'+
        '<th scope="row">'+date+'</th>'+
        '<td>'+boughtPrice+'</td>'+
        '<td>'+soldPrice+'</td>'+
        '<td>'+profit+'</td>'+
        '<td>'+margin+'</td></tr>');
    });
  });
});

$(document).on("click", 'input[type="checkbox"]' , function() {
  const botID = $(this).attr('id');
  const this1 = this;
  // let isChecked = $(this).prop("checked");
  // console.log({isChecked});
  // check Bot Balance
  $.post('/api/v1.0/changeState', {botID}, function(res){
    // console.log(res);
    if (res.state == 'Paused'){
      $(this1).prop("checked", false);
    } else {
      $(this1).prop("checked", true);
    }
    $('div.bot-state span[botid="'+botID+'"]').text(res.state);
    if (res.state == 'Waiting to sell'){
      $('div.bot-state span[botid="'+botID+'"]').text(res.state + ' $' + res.lastboughtprice );
    }
  });
});


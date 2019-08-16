///////////////////////////////////////////////
// Get coinbase BTCUSD data
///////////////////////////////////////////////
let btcusdInterval = undefined;
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
      var dataset = chart.config.data.datasets[0];
      dataset.data = data;
      chart.update();

      $('span#btc-label').text('$ ' + result[0][4]);
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
    title: {
			display: true,
			text: 'Bitcoin Price Chart'
		},
    legend: {
			display: false,
		},
    scales: {
      xAxes: [{
        type: 'time',
        distribution: 'series',
        ticks: {
          source: 'data',
          autoSkip: true
        }
      }]
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      displayColors: false,
      callbacks: {
        label: function(tooltipItem, myData) {
          let label ='$ ' + parseFloat(tooltipItem.value).toFixed(2);
          return label;
        }
      }
    }
  }
};
var chart = new Chart(ctx, cfg);
///////////////////////////////////////////////
// Show Total Profit Chart
///////////////////////////////////////////////
setInterval(() => {
  var profits=[
    [1565348400, 11675.81, 11753.47, 11685.45, 11721.95, 124.68232146],
    [1565344800, 11651.89, 11785.96, 11740.01, 11685.46, 484.11625297],
    [1565341200, 11684.07, 11830.66, 11813.64, 11740.01, 479.40748491],
    [1565337600, 11779.45, 11962.96, 11830, 11813.49, 771.26559362],
    [1565334000, 11776, 11855.96, 11840.01, 11830, 589.82499688],
    [1565330400, 11781, 11847.35, 11840.01, 11840.01, 302.61852358],
    [1565326800, 11807.66, 11885, 11880.01, 11840.95, 335.65170673],
    [1565323200, 11860.01, 11914.99, 11860.54, 11880.85, 230.17922845],
    [1565319600, 11837, 11935, 11906.3, 11860.51, 311.20050944],
    [1565316000, 11852.58, 11910, 11880.45, 11909.98, 328.31340745],
    [1565312400, 11860.04, 11959, 11957.74, 11881.15, 476.62842622],
    [1565308800, 11887, 12040, 11982.39, 11958.58, 1224.2450796],
    [1565305200, 11810.02, 12050, 11813.57, 11981, 1879.17920483],
    [1565301600, 11713.24, 11850, 11714.97, 11814.39, 654.84073977],
    [1565298000, 11587.04, 11740, 11593.99, 11714.9, 753.08594823],
    [1565294400, 11483.03, 11600, 11556.12, 11595.99, 568.51059416],
    [1565290800, 11501.55, 11647.68, 11624.99, 11560.61, 776.39053887],
    [1565287200, 11500, 11635, 11561, 11624.98, 527.97885344],
    [1565283600, 11451, 11725, 11706.37, 11561, 1918.07707378],
    [1565280000, 11638.74, 11765, 11671.15, 11702.27, 599.80653648],
    [1565276400, 11666.68, 11749.06, 11700.01, 11673.85, 528.61298863],
    [1565272800, 11620.11, 11736.6, 11669.47, 11700.01, 859.37222182],
    [1565269200, 11661.44, 11848.14, 11842.1, 11678.96, 832.37856297],
    [1565265600, 11730.04, 11909.81, 11806.78, 11841.97, 670.9718069],
    [1565262000, 11782, 11907.14, 11831.19, 11806.77, 421.41654747],
    [1565258400, 11805.36, 11869.97, 11860.21, 11834.13, 217.41325521],
    [1565254800, 11826.87, 11934, 11896.52, 11860.21, 215.17021964]]

    let data = [];
    for (let i in profits){
      let ele = profits[i];
      data.push({
        t: ele[0] * 1000,
        y: ele[4]
      })
    }
    var dataset = profitChart.config.data.datasets[0];
    dataset.data = data;
    profitChart.update();
    $('span#profit-label').text('$ ' + profits[0][4]);
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
    title: {
			display: true,
			text: 'Profit Chart'
		},
    legend: {
			display: false,
		},
    scales: {
      xAxes: [{
        type: 'time',
        distribution: 'series',
        ticks: {
          source: 'data',
          autoSkip: true
        }
      }]
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      displayColors: false,
      callbacks: {
        label: function(tooltipItem, myData) {
          let label ='$ ' + parseFloat(tooltipItem.value).toFixed(2);
          return label;
        }
      }
    }
  }
};
var profitChart = new Chart(profitCtx, profitCfg);
///////////////////////////////////////////////
// Show Bot Chart
///////////////////////////////////////////////
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
        type: 'time',
        distribution: 'series',
        ticks: {
          source: 'data',
          autoSkip: true
        }
      }]
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      displayColors: false,
      callbacks: {
        label: function(tooltipItem, myData) {
          let label ='$ ' + parseFloat(tooltipItem.value).toFixed(2);
          return label;
        }
      }
    }
  }
};
$.get('/api/v1.0/getBots', function(res){
  for (let i in res){
    let bot = res[i];
    let _id = bot._id;
    let botName = bot.name;
    let net = bot.net ? bot.net : 0;
    let newBot = '<div class="card border-light my-3 bot-panel" style="max-width: 30rem;">'+
      '<div class="card-header d-flex justify-content-between bot-header">'+
        '<div>'+
          '<span class="bot-name">'+ botName +'</span>'+
          '<div class="bot-status">Waiting to buy</div>'+
        '</div>'+
        '<div class="custom-control custom-switch">'+
          '<input type="checkbox" class="custom-control-input" id="'+_id+'">'+
          '<label class="custom-control-label" for="'+_id+'"></label>'+
        '</div>'+
        '<div>'+
          'Net : '+
          '<span class="gain-net">$ '+ net +'</span>'+
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
  }
});
///////////////////////////////////////////////
// Clicn Add New Bot Button
///////////////////////////////////////////////
$('div.addbot button').on('click', function(){
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
  console.log(form.serializeArray());
  form.submit();
});
///////////////////////////////////////////////
// Click Bot Modify button
///////////////////////////////////////////////
$(document).on("click", "a.modify" , function() {
  const botID = $(this).attr('botid');
  let record = {
    botID,
    type: 'buy',
    price: Math.random() * 10000,
    amount: Math.random() * 100,
  }

  $.post('/api/v1.0/addHistory', {record}, function(res){
    console.log(res);
  });
});
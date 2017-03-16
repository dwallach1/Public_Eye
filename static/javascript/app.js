var news_sources = [];


$(function() {
	$("#submit").click(function() {
		var company = null;
		var e = document.getElementById('newsAlert');
		if(news_sources.length == 0){
			e.style.display = 'block';
		} else {
			company = document.getElementById('search').value;
			if (company.length > 0){
            hideAlert()
				showSearchBackground();
				$('html, body').animate({
    				scrollTop: $("#particles").offset().top
					}, 1000);
				var h = document.getElementById('scraping');
				var dots = window.setInterval( function() {
				    if(h.innerHTML.length > 13) 
				        // h.innerHTML = "Scraping Web";
                  h.innerHTML = "Data Mining";
				    else 
				        h.innerHTML += ".";
				    }, 500);
            news_sources = JSON.stringify(news_sources)
				$.ajax({
		            url: '/run_query/',
		            // data: $('form').serialize(),
		            data: {'company': company, 
                        'news_sources': news_sources
                        },
		            type: 'GET',
		            success: function(response) {

                     buildDisplayData(response, company);
		            },
		            error: function(error) {
                     hideSearchBackground()
                     document.getElementById('tickerError').style.display = 'block';
                     $('html, body').animate({
                                 scrollTop: $("#tickerError").offset().top
                        }, 1000);
                                       
                      console.log("there was an error");
		            }
		        });

			} else {
				e.style.display = 'block';
			}
		
		}
		console.log(news_sources);
		console.log(company);

	});
});


function buildDisplayData(json, company){
   var company = document.getElementById('search').value;
   var companyUpper = company.toUpperCase();

   var div_result = document.createElement('div');
   document.body.insertBefore(div_result, document.getElementById("footer"));
   div_result.id = 'results';
   div_result.innerHTML += '<h1>Here are the results for '+ json[0]['company'] +'</h1>';
   div_result.innerHTML += '<h1>We Parsed ' + json.length + ' articles pertaining to your query </h1>';
  

   var sentiment = 0;
   var inputs = 0;
   var j = 1;
   var div = document.createElement('div');
   document.body.insertBefore(div, document.getElementById("footer"));
   div.id = 'data';

   div.innerHTML += '<h3 id="details">Data Gathered By <b>Public Eye</b>:</h2>';
   div.innerHTML += '<img src = "https://chart.finance.yahoo.com/z?s='+companyUpper+'&t=1my&q=l&l=off&z=s&p=m50,m200">';
   div.innerHTML += '<canvas id="myChart" width="80vw" height="50vh"></canvas>';
   div.innerHTML += '<div id="chartDemoContainer"></div>';
   markit(company, 100);
   var dataPoints = [];
   // var x_axis = [];
   // var y_axis = [];
   for(i=0;i<json.length;i++) {
         
      div.innerHTML += '<h3 id="title">' + j + '. ' +json[i]['title'] + '</h2>';
      div.innerHTML += '<p>' + json[i]['source'] + '</p>';
      div.innerHTML += '<p>' + json[i]['date'] + '</p>';
      div.innerHTML += '<p>' + json[i]['url'] + '</p>';

      if(json[i]['date'] != "NULL") {
         var date_json = json[i]['date'];
         var year = date_json.substring(0, 4);
         var month = date_json.substring(11, 13);
         var day = date_json.substring(5, 7);
         var date = new Date(year, month, day);
         console.log('inserting');
         console.log(date);
         console.log(day);
         console.log(month);
         console.log(year);
         // dataPoints.push({x: date_json, y: json[i]['sentiment']});
         dataPoints.push([date, json[i]['sentiment']]);
      }
      
      div.innerHTML += '<h3 id="sentiment">' + '<b>' + json[i]['sentiment'] + '</b>' + '</h3>';
      if(json[i]['sentiment'] != 0){
         sentiment += json[i]['sentiment'];
         inputs += 1;
      }
      j += 1;

      $("#data").css({"padding-top": "20px", "width": "100vw", "display": "none", "text-align": "center"});
      $("#sentiment").css({"color": "#007ba7"});
   }
   var avg_sentiment = sentiment /inputs;

   div_result.innerHTML += '<h1> We Found the average Sentiment to be: '+ avg_sentiment +'</h1>';
   div_result.innerHTML += '<a class="page-scroll btn btn-default btn-xl sr-button" id="showDataBtn" onclick="showData();">Analyze Data</a>';
   div_result.innerHTML += '<a class="page-scroll btn btn-default btn-xl sr-button" id="newQueryBtn" onclick="newQuery();">Run New Query</a>';
   $("#results h1").css({"color": "#fff", "text-align": "center"});
   $("#results").css({"padding-top": "150px", "width": "100vw", "height": "100vh", "background-color": "#007ba7"});
   $("#showDataBtn").css({"text-align": "center", "margin-top": "50px", "margin-left":"550px", "btn-xl.round": "24px", 
          "padding": "14px 24px", "border": "0 none", "font-weight": "700", "letter-spacing": "1px","text-transform": "uppercase",
            "background-color": "#ffcc00", "color": "#007ba7", "display":"inline-block"});
   $("#newQueryBtn").css({"text-align": "center", "margin-top": "20px", "margin-left":"540px", "btn-xl.round": "24px", 
       "padding": "14px 24px", "border": "0 none", "font-weight": "700", "letter-spacing": "1px","text-transform": "uppercase",
         "background-color": "#ffffff", "color": "#007ba7", "display":"inline-block"});


   console.log('logging datapoints');
   console.log(dataPoints);

   dataPoints.sort(function(a,b){ return a[0] - b[0]; })
   console.log('logging sorted datapoints');
   console.log(dataPoints);

   // var dp = consolidateDataPoints(dataPoints);

   // console.log('logging consolidated data');
   // console.log(dp);

   var ctx = document.getElementById("myChart");
   var scatterChart = new Chart(ctx, {
       type: 'line',
       data: {
           datasets: [{
               label: 'Public Sentiment',
               data: dataPoints
           }]
       },
       options: {
           scales: {
               xAxes: [{
                   type: 'linear',
                   position: 'bottom'
               }]
           }
       }
   });
  
   $('html, body').animate({
      scrollTop: $("#results").offset().top
      }, 1000);
   hideSearchBackground() 
}

function consolidateDataPoints(dp) {
   var currDate;
   var sentiment;
   var entries;
   var i;
   var j;

   for(i=0; i < dp.length; i++){
      sentiment = dp[i]['y'];
      entries = 1;
      currDate = dp[i]['x'];
      for(j=1; j < dp.length; j++){
         if (dp[j]['x'] == null) { continue; }
         if (dp[j]['x'] == currDate) {
            entries++;
            sentiment += dp[j]['y'];
            dp[j]['x'] = null;
         }
      }
      dp[i]['y'] =  sentiment /entries;  
   }
   console.log('logging dp before removal of nulls');
   console.log(dp);

   // for (i=0; i<dp.length; i++){
   //    if (dp[i]['x'] == null) { dp.splice(i,1); }
   // }
      
   return dp;
}

function markit(symbol, duration) {
   /** 
    * Version 2.0
    */
   var Markit = {};
   /**
    * Define the InteractiveChartApi.
    * First argument is symbol (string) for the quote. Examples: AAPL, MSFT, JNJ, GOOG.
    * Second argument is duration (int) for how many days of history to retrieve.
    */
   Markit.InteractiveChartApi = function(symbol,duration){
       this.symbol = symbol.toUpperCase();
       this.duration = duration;
       this.PlotChart();
   };

   Markit.InteractiveChartApi.prototype.PlotChart = function(){
       
       var params = {
           parameters: JSON.stringify( this.getInputParams() )
       }

       //Make JSON request for timeseries data
       $.ajax({
           beforeSend:function(){
               $("#chartDemoContainer").text("Loading chart...");
           },
           data: params,
           url: "http://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp",
           dataType: "jsonp",
           context: this,
           success: function(json){
               //Catch errors
               if (!json || json.Message){
                   console.error("Error: ", json.Message);
                   return;
               }
               this.render(json);
           },
           error: function(response,txtStatus){
               console.log(response,txtStatus)
           }
       });
   };

   Markit.InteractiveChartApi.prototype.getInputParams = function(){
       return {  
           Normalized: false,
           NumberOfDays: this.duration,
           DataPeriod: "Day",
           Elements: [
               {
                   Symbol: this.symbol,
                   Type: "price",
                   Params: ["ohlc"] //ohlc, c = close only
               },
               {
                   Symbol: this.symbol,
                   Type: "volume"
               }
           ]
           //,LabelPeriod: 'Week',
           //LabelInterval: 1
       }
   };

   Markit.InteractiveChartApi.prototype._fixDate = function(dateIn) {
       var dat = new Date(dateIn);
       return Date.UTC(dat.getFullYear(), dat.getMonth(), dat.getDate());
   };

   Markit.InteractiveChartApi.prototype._getOHLC = function(json) {
       var dates = json.Dates || [];
       var elements = json.Elements || [];
       var chartSeries = [];

       if (elements[0]){

           for (var i = 0, datLen = dates.length; i < datLen; i++) {
               var dat = this._fixDate( dates[i] );
               var pointData = [
                   dat,
                   elements[0].DataSeries['open'].values[i],
                   elements[0].DataSeries['high'].values[i],
                   elements[0].DataSeries['low'].values[i],
                   elements[0].DataSeries['close'].values[i]
               ];
               chartSeries.push( pointData );
           };
       }
       return chartSeries;
   };

   Markit.InteractiveChartApi.prototype._getVolume = function(json) {
       var dates = json.Dates || [];
       var elements = json.Elements || [];
       var chartSeries = [];

       if (elements[1]){

           for (var i = 0, datLen = dates.length; i < datLen; i++) {
               var dat = this._fixDate( dates[i] );
               var pointData = [
                   dat,
                   elements[1].DataSeries['volume'].values[i]
               ];
               chartSeries.push( pointData );
           };
       }
       return chartSeries;
   };

   Markit.InteractiveChartApi.prototype.render = function(data) {
       //console.log(data)
       // split the data set into ohlc and volume
       var ohlc = this._getOHLC(data),
           volume = this._getVolume(data);

       // set the allowed units for data grouping
       var groupingUnits = [[
           'week',                         // unit name
           [1]                             // allowed multiples
       ], [
           'month',
           [1, 2, 3, 4, 6]
       ]];

       // create the chart
       $('#chartDemoContainer').highcharts('StockChart', {
           
           rangeSelector: {
               selected: 1
               //enabled: false
           },

           title: {
               text: this.symbol + ' Historical Price'
           },

           yAxis: [{
               title: {
                   text: 'OHLC'
               },
               height: 200,
               lineWidth: 2
           }, {
               title: {
                   text: 'Volume'
               },
               top: 300,
               height: 100,
               offset: 0,
               lineWidth: 2
           }],
           
           series: [{
               type: 'candlestick',
               name: this.symbol,
               data: ohlc,
               dataGrouping: {
                   units: groupingUnits
               }
           }, {
               type: 'column',
               name: 'Volume',
               data: volume,
               yAxis: 1,
               dataGrouping: {
                   units: groupingUnits
               }
           }],
           credits: {
               enabled:false
           }
       });
   };
}



function showData() {
   console.log("in show data func");
   $("#data").css({"display": "block"});
   $('html, body').animate({
               scrollTop: $("#data").offset().top
               }, 1000);
}

function newQuery() {
   $("#results").css({"display": "none"});
   $("#data").css({"display": "none"});
   console.log("new query button clicked");
   $('html, body').animate({
               scrollTop: $("#eye").offset().top
               }, 1000);
}


function showSearchBackground() {
   	var e = document.getElementById('particles');
   	e.style.display = 'block';
   	e.style.backgroundColor =  "#ffcc00";
   	var e2 = document.getElementById('scraping');
   	e2.style.display = 'block';
}

function hideSearchBackground() {
   	var e = document.getElementById('particles');
   	e.style.display = 'none';
   	var e2 = document.getElementById('scraping');
   	e2.style.display = 'none';
}

function hideAlert() {
	var e = document.getElementById("newsAlert");
	e.style.display = 'none'
}

$('div.navbar-header').click(function(){
    console.log("reload page");
    window.location.reload(false); 

});


!function(a){function b(b,d){function e(){if(w){$canvas=a('<canvas class="pg-canvas"></canvas>'),v.prepend($canvas),p=$canvas[0],q=p.getContext("2d"),f();for(var b=Math.round(p.width*p.height/d.density),c=0;b>c;c++){var e=new l;e.setStackPos(c),x.push(e)}a(window).on("resize",function(){h()}),a(document).on("mousemove",function(a){y=a.pageX,z=a.pageY}),B&&!A&&window.addEventListener("deviceorientation",function(){D=Math.min(Math.max(-event.beta,-30),30),C=Math.min(Math.max(-event.gamma,-30),30)},!0),g(),o("onInit")}}function f(){p.width=v.width(),p.height=v.height(),q.fillStyle=d.dotColor,q.strokeStyle=d.lineColor,q.lineWidth=d.lineWidth}function g(){if(w){s=a(window).width(),t=a(window).height(),q.clearRect(0,0,p.width,p.height);for(var b=0;b<x.length;b++)x[b].updatePosition();for(var b=0;b<x.length;b++)x[b].draw();E||(r=requestAnimationFrame(g))}}function h(){for(f(),i=x.length-1;i>=0;i--)(x[i].position.x>v.width()||x[i].position.y>v.height())&&x.splice(i,1);var a=Math.round(p.width*p.height/d.density);if(a>x.length)for(;a>x.length;){var b=new l;x.push(b)}else a<x.length&&x.splice(a);for(i=x.length-1;i>=0;i--)x[i].setStackPos(i)}function j(){E=!0}function k(){E=!1,g()}function l(){switch(this.stackPos,this.active=!0,this.layer=Math.ceil(3*Math.random()),this.parallaxOffsetX=0,this.parallaxOffsetY=0,this.position={x:Math.ceil(Math.random()*p.width),y:Math.ceil(Math.random()*p.height)},this.speed={},d.directionX){case"left":this.speed.x=+(-d.maxSpeedX+Math.random()*d.maxSpeedX-d.minSpeedX).toFixed(2);break;case"right":this.speed.x=+(Math.random()*d.maxSpeedX+d.minSpeedX).toFixed(2);break;default:this.speed.x=+(-d.maxSpeedX/2+Math.random()*d.maxSpeedX).toFixed(2),this.speed.x+=this.speed.x>0?d.minSpeedX:-d.minSpeedX}switch(d.directionY){case"up":this.speed.y=+(-d.maxSpeedY+Math.random()*d.maxSpeedY-d.minSpeedY).toFixed(2);break;case"down":this.speed.y=+(Math.random()*d.maxSpeedY+d.minSpeedY).toFixed(2);break;default:this.speed.y=+(-d.maxSpeedY/2+Math.random()*d.maxSpeedY).toFixed(2),this.speed.x+=this.speed.y>0?d.minSpeedY:-d.minSpeedY}}function m(a,b){return b?void(d[a]=b):d[a]}function n(){v.find(".pg-canvas").remove(),o("onDestroy"),v.removeData("plugin_"+c)}function o(a){void 0!==d[a]&&d[a].call(u)}var p,q,r,s,t,u=b,v=a(b),w=!!document.createElement("canvas").getContext,x=[],y=0,z=0,A=!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i),B=!!window.DeviceOrientationEvent,C=0,D=0,E=!1;return d=a.extend({},a.fn[c].defaults,d),l.prototype.draw=function(){q.beginPath(),q.arc(this.position.x+this.parallaxOffsetX,this.position.y+this.parallaxOffsetY,d.particleRadius/2,0,2*Math.PI,!0),q.closePath(),q.fill(),q.beginPath();for(var a=x.length-1;a>this.stackPos;a--){var b=x[a],c=this.position.x-b.position.x,e=this.position.y-b.position.y,f=Math.sqrt(c*c+e*e).toFixed(2);f<d.proximity&&(q.moveTo(this.position.x+this.parallaxOffsetX,this.position.y+this.parallaxOffsetY),d.curvedLines?q.quadraticCurveTo(Math.max(b.position.x,b.position.x),Math.min(b.position.y,b.position.y),b.position.x+b.parallaxOffsetX,b.position.y+b.parallaxOffsetY):q.lineTo(b.position.x+b.parallaxOffsetX,b.position.y+b.parallaxOffsetY))}q.stroke(),q.closePath()},l.prototype.updatePosition=function(){if(d.parallax){if(B&&!A){var a=(s-0)/60;pointerX=(C- -30)*a+0;var b=(t-0)/60;pointerY=(D- -30)*b+0}else pointerX=y,pointerY=z;this.parallaxTargX=(pointerX-s/2)/(d.parallaxMultiplier*this.layer),this.parallaxOffsetX+=(this.parallaxTargX-this.parallaxOffsetX)/10,this.parallaxTargY=(pointerY-t/2)/(d.parallaxMultiplier*this.layer),this.parallaxOffsetY+=(this.parallaxTargY-this.parallaxOffsetY)/10}switch(d.directionX){case"left":this.position.x+this.speed.x+this.parallaxOffsetX<0&&(this.position.x=v.width()-this.parallaxOffsetX);break;case"right":this.position.x+this.speed.x+this.parallaxOffsetX>v.width()&&(this.position.x=0-this.parallaxOffsetX);break;default:(this.position.x+this.speed.x+this.parallaxOffsetX>v.width()||this.position.x+this.speed.x+this.parallaxOffsetX<0)&&(this.speed.x=-this.speed.x)}switch(d.directionY){case"up":this.position.y+this.speed.y+this.parallaxOffsetY<0&&(this.position.y=v.height()-this.parallaxOffsetY);break;case"down":this.position.y+this.speed.y+this.parallaxOffsetY>v.height()&&(this.position.y=0-this.parallaxOffsetY);break;default:(this.position.y+this.speed.y+this.parallaxOffsetY>v.height()||this.position.y+this.speed.y+this.parallaxOffsetY<0)&&(this.speed.y=-this.speed.y)}this.position.x+=this.speed.x,this.position.y+=this.speed.y},l.prototype.setStackPos=function(a){this.stackPos=a},e(),{option:m,destroy:n,start:k,pause:j}}var c="particleground";a.fn[c]=function(d){if("string"==typeof arguments[0]){var e,f=arguments[0],g=Array.prototype.slice.call(arguments,1);return this.each(function(){a.data(this,"plugin_"+c)&&"function"==typeof a.data(this,"plugin_"+c)[f]&&(e=a.data(this,"plugin_"+c)[f].apply(this,g))}),void 0!==e?e:this}return"object"!=typeof d&&d?void 0:this.each(function(){a.data(this,"plugin_"+c)||a.data(this,"plugin_"+c,new b(this,d))})},a.fn[c].defaults={minSpeedX:.1,maxSpeedX:.7,minSpeedY:.1,maxSpeedY:.7,directionX:"center",directionY:"center",density:1e4,dotColor:"#666666",lineColor:"#666666",particleRadius:7,lineWidth:1,curvedLines:!1,proximity:100,parallax:!0,parallaxMultiplier:5,onInit:function(){},onDestroy:function(){}}}(jQuery),/**
 * requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 * @see: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @see: http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 * @license: MIT license
 */
function(){for(var a=0,b=["ms","moz","webkit","o"],c=0;c<b.length&&!window.requestAnimationFrame;++c)window.requestAnimationFrame=window[b[c]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[b[c]+"CancelAnimationFrame"]||window[b[c]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(b){var c=(new Date).getTime(),d=Math.max(0,16-(c-a)),e=window.setTimeout(function(){b(c+d)},d);return a=c+d,e}),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(a){clearTimeout(a)})}();


$(document).ready(function() {
  $('#particles').particleground({
    dotColor: '#fff',
    lineColor: '#fff'
  });
  $('.intro').css({
    'margin-top': -($('.intro').height() / 2)
  });
});


/** FOR BUTTON CLICKING PROCESSING ***/
$(function() {
   $("#marketWatch").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("MarketWatch");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         // news_sources.concat(["MarketWatch"]);
         news_sources.push("MarketWatch");
      }
      console.log(news_sources);
   });
});

$(function() {
   $("#seekingAlpha").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("SeekingAlpha");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("SeekingAlpha");
      }
      console.log(news_sources);
   });
});

$(function() {
   $("#bloombergBusiness").click(function(e) {

      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Bloomberg");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Bloomberg");
      }
      console.log(news_sources)
   });
 });

$(function() {
   $("#yahooFinance").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Yahoo Finance");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Yahoo Finance");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#motleyFool").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Motley Fool");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
      news_sources.push("Motley Fool");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#reuters").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Reuters");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Reuters");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#WSJ").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Wall Street Journal");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Wall Street Journal");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#financialTimes").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Financial Times");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Financial Times");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#CNBC").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("CNBC");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("CNBC");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#IBTimes").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("IBTimes");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("IBTimes");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#googleFinance").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Google Finance");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Google Finance");
      }
      console.log(news_sources);
   });
 });

$(function() {
   $("#businessInsider").click(function(e) {
      if($(this).hasClass("active")){
         $(this).removeClass("active");
         $(this).parent().parent().removeClass("active");
         var index = news_sources.indexOf("Business Insider");
         news_sources.splice(index, 1);
      } else {
         $(this).addClass("active");
         $(this).parent().parent().addClass("active");
         news_sources.push("Business Insider");
      }
      console.log(news_sources);
   });
 });


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
                  h.innerHTML = "Data Mining";
				    else 
				        h.innerHTML += ".";
				    }, 500);
            news_sources = JSON.stringify(news_sources)
				$.ajax({
		            url: '/run_query/',
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
  
   var polarity = 0;
   var subjectivity = 0;
   var inputs = 0;
   var j = 1;
   var data_div = document.getElementById('data');
   var investing_div = document.getElementById('investing');

   investing_div.innerHTML += "<h1>Investing Advice</h1>";
   investing_div.innerHTML += "<h1>We are bullish</h1>";

   data_div.innerHTML += '<h1>Results for '+ json[0]['company'] +'</h1>';
   data_div.innerHTML += '<h1>We Parsed ' + json.length + ' articles pertaining to your query </h1>';
   
   var table = document.getElementById('table');
   var t = document.getElementById('resultTable');
   var tBody = document.getElementById('tbody');
  
   var dataPoints = [];
   
   for(i=0;i<json.length;i++) {
    var row = table.insertRow(i+1);
    // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.innerHTML =  json[i]['title'];
    cell2.innerHTML =  json[i]['polarity'];
    cell3.innerHTML =  '<a href="' + json[i]['url'] + '" target="_blank">Source</a>';
    cell4.innerHTML =  json[i]['date'];

    if(json[i]['date'] != "NULL") {
       var date_json = json[i]['date'];
       var year = parseInt(date_json.substring(0, 4));
       var day = parseInt(date_json.substring(8, 10));
       var month = parseInt(date_json.substring(5, 7));
       var date = new Date(year, month-1, day); //javascripts dates' months begin at 0
       dataPoints.push([date, json[i]['polarity'], json[i]['subjectivity']]);
    }
        
    if(json[i]['polarity'] != 0){
       polarity += json[i]['polarity'];
       inputs += 1;
    }
    j += 1;
  }

  var avg_sentiment = round((polarity / inputs), 4);


  data_div.innerHTML += '<h1> We Found the average Sentiment to be: <h1>';
  data_div.innerHTML += '<h1><span id="sentimentScore"><b>' + avg_sentiment +'</b></span></h1>';

  dataPoints.sort(function(a,b){ return a[0] - b[0]; })
  buildSentimentGraph(dataPoints);
  buildRadarChart();

  $('html, body').animate({
    scrollTop: $("#data").offset().top
    }, 1000);

  hideHomePage();
  hideSearchBackground(); 
  showData();
}

function consolidateDataPoints(dp) {
   var currDate;
   var polarity;
   var subjectivity;
   var entries;
   var i;
   var j;

   for(i=0; i < dp.length; i++){
      polarity = dp[i][1];
      subjectivity = dp[i][2];
      entries = 1;
      console.log('in here');
      for(j=0; j < dp.length; j++){
         if (dp[j][0] === null || dp[i][0] === null) {  continue; }
         if ((dp[j][0].getTime() === dp[i][0].getTime()) && (i != j)) {
            entries++;
            polarity += dp[j][1];
            subjectivity += dp[j][2];
            dp[j][0] = null;
         } else {
          continue;
         }
      }
      dp[i][1] =  polarity / entries;  
      dp[i][2] = subjectivity / entries;
   }

   for (i=0; i<dp.length; i++){ if (dp[i][0] == null) {dp.splice(i,1); i=0;} }
   return dp;
}

function buildSentimentGraph(dataPoints) {
  var dp = consolidateDataPoints(dataPoints);

  var labelsArr = [];
  for (i=0; i < dp.length; i++){
    labelsArr.push(String(dp[i][0]).substring(4,15));
    // labelsArr.push(String(dp[i][0]).substring(4,10));
  }
  var dataArr = [];
  for (i=0; i < dp.length; i++){
    dataArr.push(dp[i][1]);
  }

  var dataArr2 = [];
  for (i=0; i < dp.length; i++){
    dataArr2.push(dp[i][2]);
  }

  var sentimentData = {
        labels : labelsArr,
        datasets :
         [
            {
              label: "Polarity",
              data : dataArr,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255,99,132,1)',
              borderWidth: 1
                  
            },
            {
              label: "Subjectivity",
              data : dataArr2,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
                  
            }]
        }

  var ctx = document.getElementById('lineChart').getContext('2d');
  var myNewChart = new Chart(ctx , {
      type: "line",
      data: sentimentData, 
  });
}

function buildRadarChart(){
  var data = {
    labels: ["2/1/17", "2/23/17", "3/4/17", "3/6/17", "3/9/17", "3/10/17", "3/15/17"],
    datasets: [
        {
            label: "Sentiment",
            backgroundColor: "rgba(255, 193, 7, 0.2)",
            borderColor: "rgba(255, 193, 7, 1)",
            pointBackgroundColor: "rgba(255, 193, 7, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(255, 193, 7, 1)",
            data: [.50343, -.0012123, -.76523, .1231, -.1232, -.6432, -.00234]
        },
        {
            label: "Stock Price Day Change",
            backgroundColor: "rgba(0, 200, 83, 0.2)",
            borderColor: "rgba(0, 200, 83, 1)",
            pointBackgroundColor: "rgba(0, 200, 83, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(0, 200, 83, 1)",
            data: [2.01, .56, -3.1, -.34, 1.04, .23, -1.76]
        }
     ]
  };
  var ctx = document.getElementById('radarChart').getContext('2d');
  var myRadarChart = new Chart(ctx, {
    type: 'radar',
    data: data,
    // options: options
  });

}

function showData() {
   $("#data").css({"display": "inline-block"});
   $("#investing").css({"display": "inline-block"});
   $("#resultTable").css({"display": "block"});
   $("#lineChartContainer").css({"display": "inline-block"});
   $("#radarChartContainer").css({"display": "inline-block"});
   $("#resultButtons").css({"display": "block"});
   $('html, body').animate({
               scrollTop: $("#data").offset().top
               }, 1000);
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function hideHomePage() {
  var homePage = document.getElementById('HomeContainer');
  homePage.style.display = 'none';
}

function showHomePage() {
  var homePage = document.getElementById('HomeContainer');
  homePage.style.display = 'block';
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

// 
// 
// 
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


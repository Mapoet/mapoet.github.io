// 温度转换函数
function toCelsius(kelvin) { 
  return kelvin - 273.15; 
}
function toFahrenheit(kelvin) { 
  return toCelsius(kelvin) * 9/5 + 32; 
}
// 风速转换：m/s 转 km/h
function mpsToKmph(mps) {
  return mps * 3.6;
}
// 新增城市映射，包含中国所有知名城市（各省会及宝鸡类型及以上）
function translateAndDetect(location, callback) {
  const mapping = {
    "北京": "Beijing, CN",
    "天津": "Tianjin, CN",
    "上海": "Shanghai, CN",
    "重庆": "Chongqing, CN",
    "哈尔滨": "Harbin, CN",
    "长春": "Changchun, CN",
    "沈阳": "Shenyang, CN",
    "呼和浩特": "Hohhot, CN",
    "石家庄": "Shijiazhuang, CN",
    "太原": "Taiyuan, CN",
    "西安": "Xi'an, CN",
    "济南": "Jinan, CN",
    "郑州": "Zhengzhou, CN",
    "南京": "Nanjing, CN",
    "合肥": "Hefei, CN",
    "杭州": "Hangzhou, CN",
    "福州": "Fuzhou, CN",
    "南昌": "Nanchang, CN",
    "武汉": "Wuhan, CN",
    "长沙": "Changsha, CN",
    "广州": "Guangzhou, CN",
    "南宁": "Nanning, CN",
    "海口": "Haikou, CN",
    "成都": "Chengdu, CN",
    "贵阳": "Guiyang, CN",
    "昆明": "Kunming, CN",
    "拉萨": "Lhasa, CN",
    "西宁": "Xining, CN",
    "宝鸡": "Baoji, CN",
    "苏州": "Suzhou, CN",
    "温州": "Wenzhou, CN",
    "宁波": "Ningbo, CN",
    "徐州": "Xuzhou, CN",
    "常州": "Changzhou, CN",
    "无锡": "Wuxi, CN",
    "郑州": "Zhengzhou, CN",
    "纽约": "New York, US",
    "洛杉矶": "Los Angeles, US",
    "芝加哥": "Chicago, US",
    "伦敦": "London, UK",
    "巴黎": "Paris, FR",
    "罗马": "Rome, IT",
    "东京": "Tokyo, JP",
    "首尔": "Seoul, KR",
    "悉尼": "Sydney, AU",
    "新加坡": "Singapore, SG"
  };
  if (mapping[location]) {
    callback(mapping[location]);
  } else {
    callback(location);
  }
}
function clearCharts() {
  d3.select("#humidity-chart").selectAll("*").remove();
  d3.select("#windspeed-chart").selectAll("*").remove();
  d3.select("#pressure-chart").selectAll("*").remove();
  d3.select("#temp-chart").selectAll("*").remove();
}
function drawTemperatureGauge(celsius) {
  const width = 60, height = 300;
  const minTemp = -50, maxTemp = 60;
  const tempRange = maxTemp - minTemp;
  const svg = d3.select("#temp-chart")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
  svg.append("rect")
     .attr("x", width/4)
     .attr("y", 0)
     .attr("width", width/2)
     .attr("height", height)
     .attr("fill", "#ddd")
     .attr("rx", width/4);
  var clamped = Math.max(minTemp, Math.min(celsius, maxTemp));
  var fillPercent = (clamped - minTemp) / tempRange;
  var fillHeight = height * fillPercent;
  var gradient = svg.append("defs")
                    .append("linearGradient")
                    .attr("id", "temp-gradient")
                    .attr("x1", "0%")
                    .attr("x2", "0%")
                    .attr("y1", "100%")
                    .attr("y2", "0%");
  gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#2196F3");
  gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#FF5722");
  svg.append("rect")
     .attr("x", width/4)
     .attr("y", height - fillHeight)
     .attr("width", width/2)
     .attr("height", fillHeight)
     .attr("fill", "url(#temp-gradient)")
     .attr("rx", width/4);
  svg.append("text")
     .attr("x", width/2)
     .attr("y", height - fillHeight - 10)
     .attr("text-anchor", "middle")
     .attr("fill", "#333")
     .style("font-size", "14px")
     .text(celsius + "°C");
}
function drawHumidityGauge(humidity) {
  const width = 200, height = 200;
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius - 15;
  const numTicks = 100;
  const svg = d3.select("#humidity-chart")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width/2},${height/2})`);
  const tickAngle = 2 * Math.PI / numTicks;
  for (let i = 0; i < numTicks; i++) {
    svg.append("path")
      .attr("d", d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(i * tickAngle)
          .endAngle((i + 1) * tickAngle))
      .attr("fill", i < humidity ? "#4CAF50" : "#ddd");
  }
  svg.append("text")
     .attr("text-anchor", "middle")
     .attr("dy", "0.3em")
     .style("font-size", "1.5em")
     .text(humidity + "%");
  d3.select("#humidity-chart")
    .append("div")
    .attr("class", "chart-label")
    .text("相对湿度");
}
function drawWindSpeedGauge(windSpeedKmph) {
  const width = 300, height = 20;
  const maxWind = 100;
  const svg = d3.select("#windspeed-chart")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
  svg.append("rect")
     .attr("x", 0)
     .attr("y", 0)
     .attr("width", width)
     .attr("height", height)
     .attr("fill", "#ddd")
     .attr("rx", 10);
  svg.append("rect")
     .attr("x", 0)
     .attr("y", 0)
     .attr("width", Math.min(width, width * windSpeedKmph / maxWind))
     .attr("height", height)
     .attr("fill", "#2196F3")
     .attr("rx", 10);
  d3.select("#windspeed-chart")
     .append("div")
     .attr("class", "chart-label")
     .text("风速：" + windSpeedKmph.toFixed(2) + " km/h");
}
function drawPressureGauge(pressure) {
  const width = 300, height = 20;
  const minPressure = 900, maxPressure = 1100;
  const svg = d3.select("#pressure-chart")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
  svg.append("rect")
     .attr("x", 0)
     .attr("y", 0)
     .attr("width", width)
     .attr("height", height)
     .attr("fill", "#ddd")
     .attr("rx", 10);
  const clamped = Math.max(minPressure, Math.min(pressure, maxPressure));
  const widthPressure = width * ((clamped - minPressure) / (maxPressure - minPressure));
  svg.append("rect")
     .attr("x", 0)
     .attr("y", 0)
     .attr("width", widthPressure)
     .attr("height", height)
     .attr("fill", "#FF9800")
     .attr("rx", 10);
  d3.select("#pressure-chart")
     .append("div")
     .attr("class", "chart-label")
     .text("气压：" + pressure + " hPa");
}
function getWeather(){
  var userInput = document.getElementById("locationInput").value.trim();
  if (!userInput){
    alert("请输入地点！");
    return;
  }
  clearCharts();
  translateAndDetect(userInput, function(locationEnglish){
    document.getElementById("locationName").innerText = "查询地点：" + locationEnglish;
    var url = "https://api.openweathermap.org/data/2.5/weather?q="
              + encodeURIComponent(locationEnglish)
              + "&appid=a3d9b50b2022aaff3f6b7eb24288e5c8";
    d3.json(url, function(error, data) {
      if (error || !data || data.cod !== 200) {
        document.getElementById("temp-c").innerText = "";
        document.getElementById("temp-f").innerText = "";
        alert("无法获取天气数据，请检查地点是否正确。");
        return;
      }
      var kelvin = data.main.temp;
      var celsius = toCelsius(kelvin).toFixed(2);
      var fahrenheit = toFahrenheit(kelvin).toFixed(2);
      document.getElementById("temp-c").innerText = "摄氏温度：" + celsius + " °C";
      document.getElementById("temp-f").innerText = "华氏温度：" + fahrenheit + " °F";
      drawTemperatureGauge(parseFloat(celsius));
      var humidity = data.main.humidity;
      var windSpeed = data.wind.speed;
      var windSpeedKmph = mpsToKmph(windSpeed);
      var pressure = data.main.pressure;
      drawHumidityGauge(humidity);
      drawWindSpeedGauge(windSpeedKmph);
      drawPressureGauge(pressure);
    });
  });
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('weatherBtn').addEventListener('click', getWeather);
}); 
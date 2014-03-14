var margin = {top: 0, right: 20, bottom: 30, left: 20},
    outerWidth = 800,
    outerHeight = 200,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

var stops = [
  'South Station',
  'Downtown Crossing',
  'Park Street',
  'Charles/MGH',
  'Kendall/MIT'
];
var pairs = [];
var ranges = {};
var pairIdx = {};
for (var i = 0; i < stops.length - 1; i++) {
  var name = stops[i] + "-" + stops[i + 1];
  var it = name;
  pairs.push(name);
  pairIdx[name] = 'section' + i;
  ranges[it] = {};
}

var outer = d3.select('body').selectAll('div').data(pairs).enter().append('div');
outer.append('h2').text(function (d) { return d; });
outer.append('div').attr('class', function (d, i) { return 'section' + i; });
d3.json('data.json', function (histogram) {
  setTimeout(function poll() {
    d3.jsonp('http://jsonpwrapper.com/?urls%5B%5D=http%3A%2F%2Fdeveloper.mbta.com%2Flib%2Frthr%2Fred.json&callback={callback}', function (data) {
      var body = JSON.parse(data[0].body);
      body.TripList.Trips.forEach(function (trip) {
        var byStop = {};
        trip.Predictions.forEach(function (prediction) {
          byStop[prediction.Stop] = prediction.Seconds;
        });
        pairs.forEach(function (p) {
          var split = p.split("-");
          var FROM = split[0];
          var TO = split[1];
          if (byStop.hasOwnProperty(FROM) &&
              byStop.hasOwnProperty(TO) &&
              byStop[TO] > byStop[FROM]) {
            var diff = byStop[TO] - byStop[FROM];
            var percent = findPercent(histogram[p], diff);
            d3.selectAll('.' + pairIdx[p]).text(diff + ' secs (' + Math.round(percent * 100) + '%)');
          }
        });
      });
      setTimeout(poll, 15000);
    });
  });
});

function findPercent(hist, needle) {
  var less = 0;
  var total = 0;
  Object.keys(hist).forEach(function (bucketBottom) {
    var bottom = +bucketBottom;
    total += hist[bucketBottom];
    if (bottom < needle) {
      less += hist[bucketBottom];
    }
  });
  return less / total;
}
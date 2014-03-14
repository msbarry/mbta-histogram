(function () {
  "use strict";
  
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
    var n = stops[i] + "-" + stops[i + 1];
    var it = n;
    pairs.push(n);
    pairIdx[n] = 'section' + i;
    ranges[it] = {};
  }

  var outer = d3.select('body').selectAll('div').data(pairs).enter().append('div');
  outer.append('h2').text(function (d) { return d; });
  var containers = outer.append('div').attr('class', function (d, i) { return 'section' + i; });
  containers.append('p');
  var charts = containers.append('div');
  d3.json('data.json', function (histogram) {
    // draw the histogram

    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        outerWidth = 300,
        outerHeight = 50,
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom;


    var svg = charts
      .append('svg')
        .attr("width", outerWidth)
        .attr("height", outerHeight)
      .append('g')
        .attr('tranform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.selectAll('.bar')
        .data(function (d) {
          var buckets = d3.keys(histogram[d])
            .filter(function (bucket) {
              var pct = findPercent(histogram[d], +bucket);
              return pct < 0.97 && pct > 0.005;
            });
          var extent = d3.extent(buckets.map(Number));
          var x = d3.scale.ordinal()
              .rangeRoundBands([0, width])
              .domain(d3.range(extent[0], extent[1] + 1));
          var y = d3.scale.linear()
              .range([0, height])
              .domain([0, d3.max(d3.values(histogram[d]))]);
          return buckets.map(function (key) {
            return {
              bucket: +key,
              count: histogram[d][key],
              x: x,
              y: y
            };
          });
        })
        .enter()
      .append('rect')
        .attr('class', 'bar')
        .attr('x', function (d) { return d.x(d.bucket); })
        .attr('height', function (d) { return d.y(d.count); })
        .attr('width', function (d) { return d.x.rangeBand(); })
        .attr('y', function (d) { return height - d.y(d.count); });

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
              d3.selectAll('.' + pairIdx[p] + ' p').text(diff + ' secs (' + Math.round(percent * 100) + '%)');
              d3.selectAll('.' + pairIdx[p] + ' .bar')
                .classed('below', function (d) {
                  return d.bucket < diff;
                });
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
}());
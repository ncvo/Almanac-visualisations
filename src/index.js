let app = document.querySelector('#app')


app.innerHTML = '<h2>Welcome to moneyflow</h2>'

import d3 from 'd3';
import _ from 'underscore';
import arcSet from './arcSet';

function makeArcs(container, options) {
  let bgArcs = arcSet({
    ...options,
    fill: options.bgFill,
    progress: d => 1,
  });

  let fgArcs = arcSet({
    ...options,
    fill: options.fgFill,
    animateIn: d => true,
  });

  container = container.append('g');
  let bgContainer = container.append('g').attr('class', 'bg');
  let fgContainer = container.append('g').attr('class', 'fg');

  return function update(data) {
    bgContainer.datum(data).call(bgArcs);
    fgContainer.datum(data).call(fgArcs);
  };
}

function init() {
  const WIDTH = 1300, HEIGHT = 1600;
  let container = d3.select('#app').append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .append('g')
    .attr('transform', `translate(${WIDTH/2}, ${HEIGHT/2})`);




  let data = [
    {type: 'income', value: 18.8},
    {type: 'income', value: 13.3},
    {type: 'income', value: 3.3},
    {type: 'income', value: 2.9},
    {type: 'income', value: 1.7},
    {type: 'income', value: 0.5},


    {type: 'reinvest', value: 15},
    {type: 'reinvest', value: 5},

    {type: 'outgoing', value: 1.2},
    {type: 'outgoing', value: 29.9},
    {type: 'outgoing', value: 0.7},

  ];
  data.reverse()
  _.map(_.groupBy(data, 'type'), list => list.forEach((d,i) => {
    d.ring = i;
  }));

  let bgColor = d3.scale.linear().domain([0, 6]).range(['#DDDBC6', '#A7AF5B']);
  let fgColor = d3.scale.linear().domain([0, 6]).range(['#8E7FB8', '#522977']);

  let sums = _.mapObject(_.groupBy(data, 'type'), d => d3.sum(d, d => d.value));
  data = _.groupBy(data, 'type');

  let arcDefaults = {
    ring: d => d.ring,
    progress: (d,i) => d.value/sums[d.type],
    bgFill: (d,i) => bgColor(i),
    fgFill: (d,i) => fgColor(i),
  };

  let incomeArcs = makeArcs(container, {
    ...arcDefaults,
    innerRadius: d => 227,
    arcWidth: 44,
  });

  let reinvestArcs = makeArcs(container, {
    ...arcDefaults,
    right: d => false,
    innerRadius: d => 227,
    arcWidth: 44,
  });

  let outgoingArcs = makeArcs(container, {
    ...arcDefaults,
    right: d=> false,
    clockwise: d => false,
    innerRadius: d => 72,
    arcWidth: 44,
    center: d => [0, 227 + 72 + 44 * (data["income"].length)],
  });

  incomeArcs(data["income"]);
  outgoingArcs(data["outgoing"]);
  reinvestArcs(data["reinvest"]);

  // let bgArcs = arcSet({
  //   ring: d => d.ring,
  //   fill: (d,i) => bgColor(i),
  //   clockwise: d => d.type !== 'outgoing',
  //   right: d => d.type === 'income',
  //   innerRadius=d => 227,
  // });

  // let fgArcs = arcSet({
  //   fill: (d,i) => fgColor(i),
  //   animateIn: d => true,
  //   ring: d => d.ring,
  //   progress: (d,i) => d.value/sums[d.type],
  //   clockwise: d => d.type !== 'outgoing',
  //   right: d => d.type === 'income',
  // });

  // bgContainer.datum(data).call(bgArcs);
  // fgContainer.datum(data).call(fgArcs);


}

init();

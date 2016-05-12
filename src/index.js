let app = document.querySelector('#app')


app.innerHTML = '<h2>Welcome to moneyflow</h2>'

import d3 from 'd3';
import _ from 'underscore';
import arcSet from './arcSet';
import infoBox from './infoBox';
import infoItems from './infoItems';
import startDots from './startDots';

function arcIndicators({bgFill, fgFill, values, ...options}) {
  let bgArcs = arcSet({
    ...options,
    fill: bgFill,
    progress: d => 1,
  });

  let fgArcs = arcSet({
    ...options,
    fill: fgFill,
    animateIn: d => true,
  });

  return function update(container) {
    let selector = container.selectAll('.arcsContainer').data((d,i) => {
      return [null];
    });

    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'arcsContainer')
    enter.append('g').attr('class', 'bg');
    enter.append('g').attr('class', 'fg');

    let bgContainer = selector.select('.bg');
    let fgContainer = selector.select('.fg');

    bgContainer.data((d,i) => [values(d,i)]).call(bgArcs);
    fgContainer.data((d,i) => [values(d,i)]).call(fgArcs);
  };
}


function outputInfo({values, top, left, lineHeight, arrowFill}) {
  // infoItems grows from the bottom, but we can give a negative
  // lineHeight to have it grow from the top
  let info = infoItems({bottom: top, lineHeight: -lineHeight, left: 125, fontSize: 16});

  return function update(container) {
    let selector = container.selectAll('.outputInfo').data((d,i) => {
      return [values(d,i)];
    });


    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'outputInfo')

    selector.attr('transform', `translate(${left}, 0)`);

    selector.call(info);
  };
}


function arrowHeads({values, top, left=0, lineHeight, arrowFill}) {
  return function update(container) {
    let arrowHeads = container.selectAll('.arrowHeads').data((d,i) => values(d,i));
    arrowHeads.exit().remove();
    arrowHeads.enter().append('path');
    arrowHeads
      .attr('fill', arrowFill)
      .attr('d', (d,i) => {
        return `
        M ${left} ${top+lineHeight*i-15}
        L ${left} ${top+lineHeight*(i+1)+15}
        L ${left+40} ${top+lineHeight*(i+0.5)}
        Z
        `;
      });
  };
}


function joinBox({value, top, width=165, border=16, height}) {
  return function update(container) {
    let selector = container.selectAll('.joinBox').data((d,i) => {
      return [value(d,i)];
    });

    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'joinBox')
    enter.append('rect').attr({y: top, x: -width/2, width: width, height: height}).attr('fill', '#5D3785');
    enter.append('rect').attr({y: top, x: -width/2 + width/3, width: width/3*2, height: height}).attr('fill', '#674591');
    enter.append('rect').attr({y: top, x: -width/2 + width/3 * 2, width: width/3, height: height}).attr('fill', '#7D67A7');
    enter.append('rect').attr({y: top+16, x: -width/2, width, height: height-border*2}).attr('fill','#522977');
    enter.append('text')
      .text('Income')
      .attr({'text-anchor': 'middle', 'font-size': 36, 'font-family': 'sans-serif', fill: 'white'})
      .attr('y', top + height/2 + 50)
      .style({opacity: 0.8})

    enter.append('text')
      .attr('class', 'amount')
      .attr({'text-anchor': 'middle', 'font-size': 36, 'font-family': 'sans-serif', fill: 'white', 'font-weight': 'bold'})
      .attr('y', top + height/2 + 50)
      .attr('dy', '1em')
      .style({opacity: 0.8})

    let format = d3.format(",.2r");
    selector.select('.amount').text(d => '£' + format(d) + 'bn');
  };
}

function init(data) {
  const WIDTH = 1300, HEIGHT = 1700;
  data.reverse()
  data = _.groupBy(data, 'Type');
  data = _.mapObject(data, (lines, type) => {
    return _.map(_.groupBy(lines, 'Source'), (sourceLines, source) => {
      return {label: source, value: d3.sum(sourceLines, d => parseFloat(d["Total"]))/1000, type};
    });
  });

  _.map(data, list => list.forEach((d,i) => {
    d.ring = i;
  }));

  let sums = _.mapObject(data, d => d3.sum(d, d => d.value));
  let lengths = _.mapObject(data, d => d.length);

  let bgColor = d3.scale.linear().domain([0, 1]).range(['#DDDBC6', '#A7AF5B']);
  let fgColor = d3.scale.linear().domain([0, 1]).range(['#8E7FB8', '#522977']);
  let dotColor = d3.scale.linear().domain([0, lengths.income]).range(['#BDB5D6', '#9B83B0']);


  let highlighted = null;

  const TOP_INNER_RADIUS = 227;
  const ARC_WIDTH = 44;
  const ARC_WIDTH_BOTTOM= 50;
  const BOTTOM_INNER_RADIUS = 120;
  const INFO_WIDTH = 244;
  const OFFSET_BOTTOM = 80;

  let arcDefaults = {
    ring: d => d.ring,
    progress: (d,i) => {
      return d.value/sums[d.type]
    },
    mouseover: (d,i) => highlight(d),
    mouseout: (d,i) => highlight(null),
    click: (d,i) => highlight(d),
    opacity: (d,i) => {
      return (highlighted == null || highlighted === d) ? 1 : 0.6
    },
  };

  let incomeArcs = arcIndicators({
    ...arcDefaults,
    innerRadius: d => TOP_INNER_RADIUS,
    arcWidth: ARC_WIDTH,
    values: d => d["income"],
    bgFill: (d,i) => bgColor(i/(lengths.income-1)),
    fgFill: (d,i) => fgColor(i/(lengths.income-1)),
  });

  let reinvestArcs = arcIndicators({
    ...arcDefaults,
    right: d => false,
    innerRadius: d => TOP_INNER_RADIUS,
    arcWidth: ARC_WIDTH,
    values: d => d["reinvest"],
    bgFill: (d,i) => bgColor(i/(lengths.income-1)),
    fgFill: (d,i) => fgColor((lengths.reinvest-i-1)/(lengths.income-1)),
  });

  let outgoingArcs = arcIndicators({
    ...arcDefaults,
    right: d=> false,
    clockwise: d => false,
    innerRadius: d => BOTTOM_INNER_RADIUS,
    arcWidth: ARC_WIDTH_BOTTOM,
    center: d => [OFFSET_BOTTOM, TOP_INNER_RADIUS + BOTTOM_INNER_RADIUS + ARC_WIDTH * (lengths.income)],
    values: d => d["outgoing"],
    bgFill: (d,i) => bgColor((lengths.outgoing-i-1)/(lengths.outgoing-1)),
    fgFill: (d,i) => fgColor(i/(lengths.outgoing-1)),
  });

  let info = infoBox({
    bottom: -TOP_INNER_RADIUS,
    width: INFO_WIDTH,
    lineHeight: ARC_WIDTH,
    borderColor: '#522977',
    dotFill: (d,i) => dotColor(i),
    values: d => d["income"],
  });

  let outputOptions = {
    top: lengths.income * ARC_WIDTH + TOP_INNER_RADIUS + BOTTOM_INNER_RADIUS * 2,
    left: -OFFSET_BOTTOM,
    lineHeight: ARC_WIDTH_BOTTOM,
    values: d => d["outgoing"],
    arrowFill: (d,i) => bgColor((lengths.outgoing-i-1)/(lengths.outgoing-1)),
  };

  let output = outputInfo(outputOptions);
  let arrows = arrowHeads(outputOptions);

  let join = joinBox({
    value: d => sums.income,
    top: TOP_INNER_RADIUS - ARC_WIDTH,
    height: ARC_WIDTH * (lengths.income+1.5),
  });

  let reinvestmentDots = startDots({
    dotFill: (d,i) => dotColor(i),
    top: TOP_INNER_RADIUS-16,
    lineHeight: ARC_WIDTH,
    left: -95
  });

  let outgoingDots = startDots({
    dotFill: (d,i) => dotColor(i),
    bottom: TOP_INNER_RADIUS + ARC_WIDTH * lengths.income,
    lineHeight: ARC_WIDTH_BOTTOM,
    left: -95
  });

  let container = d3.select('#app').append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .append('g')
    .attr('transform', `translate(${WIDTH/2}, 520)`)
    .datum(data);

  let containers= _.object(["income", "outgoing", "reinvest", "info", "output", "arrows", "join", "redots", "outdots"].map(n => [n, container.append('g')]));

  function highlight(d) {
    highlighted = d;
    update();
  }

  function update() {
    containers.income.call(incomeArcs);
    containers.outgoing.call(outgoingArcs);
    containers.reinvest.call(reinvestArcs);
    containers.info.call(info);
    containers.output.call(output);
    containers.arrows.call(arrows);
    containers.join.call(join);
    containers.redots.data([data.reinvest]).call(reinvestmentDots);
    containers.outdots.data([data.outgoing]).call(outgoingDots);
  }

  update();
}

d3.csv("data.csv", init);

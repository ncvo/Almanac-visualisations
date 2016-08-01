import d3 from 'd3';
import _ from 'underscore';
import arcSet from './arcSet';
import infoBox from './infoBox';
import infoItems from './infoItems';
import startDots from './startDots';
import detailsList from './detailsList';

const NATIONALLY = "United Kingdom";

function bubble(container, position, bgFill, title, value) {
  let g = container.append('g')
      .attr('transform', `translate(${position[0]}, ${position[1]})`);
  g.append('circle').attr('r', 35).attr('fill', bgFill);
  g.append('text')
    .text(title)
    .attr('dy', -5)
    .attr({'text-anchor': 'middle', 'font-size': 12, 'font-family': 'sans-serif', fill: 'white'});

  g.append('text')
    .attr('class', 'value')
    .attr('dy', 12)
    .attr({'text-anchor': 'middle', 'font-size': 16, 'font-family': 'sans-serif', fill: 'white'});

  let format = d3.format(",.1f");

  return function update(value) {
    g.select('.value').text('£' + format(value) + 'bn');
  };
}

function arcIndicators({bgFill, fgFill, values, maxProgress=1, endCaps=true, ...options}) {
  let bgArcs = arcSet({
    ...options,
    fill: bgFill,
    endCaps,
    progress: d => maxProgress,
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


function outputInfo({values, top, left, lineHeight, arrowFill, borderColor="#8ACAC0"}) {
  // infoItems grows from the bottom, but we can give a negative
  // lineHeight to have it grow from the top
  let info = infoItems({bottom: top, lineHeight: -lineHeight, left: 60, fontSize: 13, iconHeight: 30});
  let details = detailsList({top: top, lineHeight: lineHeight / 2, fontSize: 12, left: 300});

  let lastHighlighted;
  return function update(container, highlighted) {
    let selector = container.selectAll('.outputInfo').data((d,i) => {
      return [values(d,i)];
    });


    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'outputInfo')
    enter.append('g').attr('class', 'details');
    enter.append('line').attr('class', 'border');

    selector.attr('transform', `translate(${left}, 0)`);
    selector.call(info, highlighted);

    selector.select('.border')
      .attr('x1',250).attr('y1', top - lineHeight * 0.25)
      .attr('x2',250).attr('y2', d => top + lineHeight * d.length + lineHeight * 0.1)
      .attr('stroke-width', '8')
      .attr('stroke', borderColor);

    selector.select('.details')
      .attr('transform', `translate(0, ${lineHeight * (highlighted || lastHighlighted || {ring: 0}).ring})`)
      .data((d,i) => (highlighted || lastHighlighted) ? [[highlighted || lastHighlighted]] : [], d => 1)
      .call(details)
      .style('opacity', (highlighted && highlighted.breakdown.length > 1) ? 1 : 0);

    lastHighlighted = highlighted
  };
}


function arrowHeads({values, top, left=0, lineHeight, arrowFill, direction=1}) {
  return function update(container) {
    let arrowHeads = container.selectAll('.arrowHead').data((d,i) => values(d,i));
    arrowHeads.exit().remove();
    arrowHeads.enter().append('path');
    arrowHeads
      .attr('class', 'arrowHead')
      .attr('fill', arrowFill)
      .attr('d', (d,i) => {
        return `
        M ${left} ${top+lineHeight*i-15}
        L ${left} ${top+lineHeight*(i+1)+15}
        L ${left+(40*direction)} ${top+lineHeight*(i+0.5)}
        Z
        `;
      });
  };
}


function joinBox({value, top, width=20, border=16, height}) {
  return function update(container) {
    let selector = container.selectAll('.joinBox').data((d,i) => {
      return [value(d,i)];
    });

    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'joinBox')
    enter.append('rect').attr({y: top, x: -width/2, width: width, height: height}).attr('fill', '#5D3785');
    // enter.append('rect').attr({y: top, x: -width/2 + width/3, width: width/3*2, height: height}).attr('fill', '#674591');
    // enter.append('rect').attr({y: top, x: -width/2 + width/3 * 2, width: width/3, height: height}).attr('fill', '#7D67A7');
    // enter.append('rect').attr({y: top+16, x: -width/2, width, height: height-border*2}).attr('fill','#522977');
    // enter.append('text')
    //   .text('Income')
    //   .attr({'text-anchor': 'middle', 'font-size': 36, 'font-family': 'sans-serif', fill: 'white'})
    //   .attr('y', top + height/2 + 50)
    //   .style({opacity: 0.8})

    // enter.append('text')
    //   .attr('class', 'amount')
    //   .attr({'text-anchor': 'middle', 'font-size': 36, 'font-family': 'sans-serif', fill: 'white', 'font-weight': 'bold'})
    //   .attr('y', top + height/2 + 70)
    //   .attr('dy', '1em')
    //   .style({opacity: 0.8})

    // let iconHeight = 100
    // enter.append('image')
    //   .attr('x', -iconHeight/2)
    //   .attr('y', top + height/2 - 100)
    //   .attr('width', iconHeight)
    //   .attr('height', iconHeight)
    //   .attr('xlink:href', "icons/income.svg");

    // let format = d3.format(",.2r");
    // selector.select('.amount').text(d => '£' + format(d) + 'bn');
  };
}

function regionSelect(container, regions, onChange) {
  let width = 320;
  let height = 44;
  let selector = container.append('g')
    .attr('transform', 'translate(180, 31)');

  regions = [NATIONALLY].concat(regions);
  let current = 0;

  selector.append('rect').attr({
    x: -width/2,
    y: -height/44,
    width,
    height,
    fill: '#522977',
  });


  selector.append('text')
    .text("\u25C0")
    .attr({
      'font-size': 20,
      fill: 'white',
      y: 28,
      x: -width/2 + 10,
    });

  selector.append('text')
    .text("\u25B6")
    .attr({
      'font-size': 20,
      fill: 'white',
      y: 28,
      x: width/2 - 30,
    });

  let left = selector.append('rect')
    .attr({
      x: -width/2,
      y: -height/44,
      width: width/2,
      height,
      fill: 'transparent',
    })
    .on('click', () => {
      current = (current === 0) ? regions.length - 1 : current - 1;
      selector.select('.label')
        .text(regions[current]);
      onChange(regions[current]);
    });


  let right = selector.append('rect').attr({
    x: 0,
    y: -height/44,
    width: width/2,
    height,
    fill: 'transparent',
  })
  .on('click', () => {
    current = (current + 1) % regions.length;
    selector.select('.label')
      .text(regions[current]);
    onChange(regions[current]);
  })

  selector.append('text')
    .attr('class', 'label')
    .text(regions[current])
    .attr({
      fill: 'white',
      y: 28,
      'font-weight': 100,
      'text-anchor': 'middle',
      'font-family': 'sans-serif',
      'font-size': 20
    });

  selector.selectAll('text').style('pointer-events', 'none');

}

function init(nationalData, regionalData) {
  const WIDTH = 1100, HEIGHT = 1500;

  let data = nationalData;

  let lengths = _.mapObject(nationalData, d => d.length);

  let bgColor = d3.scale.linear().domain([0, 1]).range(['#DDDBC6', '#A7AF5B']);
  let fgColor = d3.scale.linear().domain([0, 1]).range(['#8E7FB8', '#522977']);
  let dotColor = d3.scale.linear().domain([0, lengths.income]).range(['#BDB5D6', '#9B83B0']);


  let highlighted = null;

  const TOP_INNER_RADIUS = 120;
  const ARC_WIDTH = 35;
  const ARC_WIDTH_BOTTOM= 45;
  const BOTTOM_INNER_RADIUS = 80;
  const INFO_WIDTH = 244;
  const OFFSET_BOTTOM = 10;

  let arcDefaults = {
    ring: d => d.ring,
    progress: (d,i) => {
      // console.log(d.value, d3.sum(data[d.type], dd => dd.value), data);
      return d.value/d3.sum(data[d.type], dd => dd.value);
    },
    mouseover: (d,i) => highlight(d),
    mouseout: (d,i) => highlight(null),
    click: (d,i) => highlight(d),
    opacity: (d,i) => {
      return (highlighted == null || highlighted === d) ? 1 : 0.6
    },
  };

  // Highlight color
  function hc(scale, nonHighlightColor) {
    return (d,i) => {
      if (d === highlighted) {
        return scale(1);
      } else {
        return scale(nonHighlightColor(d,i));
      }
    };
  }

  let incomeArcs = arcIndicators({
    ...arcDefaults,
    innerRadius: d => TOP_INNER_RADIUS,
    arcWidth: ARC_WIDTH,
    values: d => d["income"],
    // bgFill: hc(bgColor, (d,i) => i/(lengths.income-1)),
    // fgFill: hc(fgColor, (d,i) => i/(lengths.income-1)),
    fgFill: (d,i) => "#522977",
    bgFill: (d,i) => "#7D67A6"
  });

  let reinvestArcs = arcIndicators({
    ...arcDefaults,
    right: d => false,
    innerRadius: d => TOP_INNER_RADIUS,
    arcWidth: ARC_WIDTH+5,
    // animationDelay: 800,

    // Make the arc not go all the way round
    maxProgress: 0.6,
    progress: (d,i) => {
      // console.log(d.value, d3.sum(data[d.type], dd => dd.value), data);
      return (d.value/d3.sum(data[d.type], dd => dd.value)) * 0.6
    },

    values: d => d["reinvest"],
    // bgFill: hc(bgColor, (d,i) => i/(lengths.income-1)),
    // fgFill: hc(fgColor, (d,i) => (lengths.reinvest-i-1)/(lengths.income-1)),
    fgFill: (d,i) => "#8ACAC0",
    bgFill: (d,i) => "#CBEDE6",
  });

  let outgoingArcs = arcIndicators({
    ...arcDefaults,
    // animationDelay: 1000,
    right: d=> false,
    clockwise: d => false,
    innerRadius: d => BOTTOM_INNER_RADIUS,
    arcWidth: ARC_WIDTH_BOTTOM,
    // center: d => [OFFSET_BOTTOM, TOP_INNER_RADIUS + BOTTOM_INNER_RADIUS + ARC_WIDTH * (lengths.income)],
    center: d => [OFFSET_BOTTOM, TOP_INNER_RADIUS + BOTTOM_INNER_RADIUS + ARC_WIDTH * (lengths.income)],
    values: d => d["outgoing"],
    // bgFill: hc(bgColor, (d,i) => (lengths.outgoing-i-1)/(lengths.outgoing-1)),
    // fgFill: hc(fgColor, (d,i) => i/(lengths.outgoing-1)),
    fgFill: (d,i) => "#8ACAC0",
    bgFill: (d,i) => "#CBEDE6",
  });

  let info = infoBox({
    bottom: -TOP_INNER_RADIUS,
    top: -TOP_INNER_RADIUS - ARC_WIDTH * lengths.income,
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
    // arrowFill: (d,i) => bgColor((lengths.outgoing-i-1)/(lengths.outgoing-1)),
    arrowFill: (d,i) => "#CBEDE6",
  };


  let output = outputInfo(outputOptions);
  let arrows = arrowHeads(outputOptions);

  let join = joinBox({
    value: d => d3.sum(data.income, dd => dd.value),
    // top: TOP_INNER_RADIUS - ARC_WIDTH,
    // height: ARC_WIDTH * (lengths.income+1.5),
    top: TOP_INNER_RADIUS,
    height: ARC_WIDTH * (lengths.income),
  });

  let reinvestmentDots = startDots({
    // dotFill: (d,i) => dotColor(i),
    dotFill: (d,i) => "#BCE1DA",
    top: TOP_INNER_RADIUS,
    lineHeight: ARC_WIDTH,
    left: -20
  });

  let outgoingDots = startDots({
    // dotFill: (d,i) => dotColor(i),
    dotFill: (d,i) => "#BCE1DA",
    bottom: TOP_INNER_RADIUS + ARC_WIDTH * lengths.income,
    lineHeight: ARC_WIDTH_BOTTOM,
    left: -20
  });

  let svg = d3.select('#moneyflow').append('svg')
  let container = svg
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .append('g')
      .attr('transform', `translate(400, 430) scale(0.001)`)

  container
    .transition()
    .duration(1500)
    .ease('quad')
    .attr('transform', `translate(400, 430) scale(1)`)

  regionSelect(
    svg,
    _.sortBy(_.keys(regionalData), _.identity),
    region => {
      data = (region === NATIONALLY) ? nationalData : regionalData[region];
      update();
    }
  );


  let format = d3.format(",.2r");

  let updateIncomeBubble = bubble(
    container,
    [350, -240],
    "#522977",
    "Income");

  let updateSpendingBubble = bubble(
    container,
    [-250, 210],
    "#8ACAC0",
    "Spending")


  let containers = _.object(["income", "outgoing", "reinvest", "info", "output", "arrows", "join", "redots", "outdots"].map(n => [n, container.append('g')]));

  function highlight(d) {
    if (d === highlighted) d = null;
    highlighted = d;
    if (highlighted == null) {
      // We might be setting another highlight almost right away so
      // lets not be hasty with the transitions
      setTimeout(update);
    } else {
      update();
    }
  }

  function update() {
    containers.income                        .datum(data).call(incomeArcs);
    containers.outgoing                      .datum(data).call(outgoingArcs);
    containers.reinvest                      .datum(data).call(reinvestArcs);
    containers.info                          .datum(data).call(info, (highlighted && highlighted.type !== 'outgoing') ? highlighted : null);
    containers.output                        .datum(data).call(output, (highlighted && highlighted.type === 'outgoing') ? highlighted : null);
    containers.arrows                        .datum(data).call(arrows);
    containers.join                          .datum(data).call(join);
    containers.redots.data([data.reinvest])  .call(reinvestmentDots);
    containers.outdots.data([data.outgoing]) .call(outgoingDots);

    updateIncomeBubble(d3.sum(data.income, dd => dd.value));
    updateSpendingBubble(d3.sum(data.outgoing, dd => dd.value) + d3.sum(data.reinvest, dd => dd.value))
  }

  update();
}

function prepNational(data, config) {
  data.reverse()
  data = _.groupBy(data, 'Type');
  data = _.mapObject(data, (lines, type) => {
    if (type === "outgoing") {
      lines.reverse()
    }
    return _.map(_.groupBy(lines, 'Source'), (sourceLines, source) => {
      return {
        label: source,
        value: d3.sum(sourceLines, d => parseFloat(d["Total"]))/1000,
        type,
        icon: config.iconsRoot +  source.toLowerCase().replace(/ /, '-') + '.svg',
        breakdown: sourceLines.map(d => ({
          label: d['Sub-Source'],
          value: parseFloat(d["Total"])/1000,
        }))
      };
    });
  });

  _.map(data, list => list.forEach((d,i) => {
    d.ring = i;
  }));
  return data;
}

function prepRegional(data, config) {
  data.reverse()
  let regions = _.without(_.keys(data[0]), "Type", "Source");
  return _.object(regions.map(r => {
    let regionData = _.mapObject(_.groupBy(data, 'Type'), (lines, type) => {
      if (type === "outgoing") {
        lines.reverse()
      }
      return lines.map(line => ({
        label: line["Source"],
        value: parseFloat(line[r])/1000,
        icon: config.iconsRoot + line["Source"].toLowerCase().replace(/ /, '-') + '.svg',
        type,
        breakdown: [],
      }));
    });

    _.map(regionData, list => list.forEach((d,i) => {
      d.ring = i;
    }));
    return [r, regionData];
  }));
}

function moneyflow(config) {
  _.defaults(config, {
    dataRoot: '',
    iconsRoot: '',
  });
  let national, regional;
  let done = _.after(2, () => init(prepNational(national, config), prepRegional(regional, config)));
  d3.csv(config.dataRoot + "national.csv", d => {
    national = d;
    done();
  });

  d3.csv(config.dataRoot + "regions.csv", d => {
    regional = d;
    done();
  });
}

window.moneyflow = moneyflow;

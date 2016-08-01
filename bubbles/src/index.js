import d3 from 'd3';
import _ from 'underscore'

let app = document.querySelector('#bubbles')


export function pol2cart(r, a, cx=0, cy=0) {
  let x = cx + r * Math.cos(a);
  let y = cy + r * Math.sin(a);
  return [x,y];
}

export function cart2pol(x, y, cx=0, cy=0) {
  x = x - cx;
  y = y - cy;
  let r = Math.sqrt(x*x + y*y);
  let a = Math.atan2(y, x);
  return [r, a];
}


function formatMoney(amount) {
  let format = d3.format(",.2r");
  let millions = amount / 1000000;
  return '£' + format(millions) + 'm';
}


let formatCount = d3.format(",r");

function bubblesVis({data, container, depth=0, gravity=0, width, height, radius=300, maxAmount, fillColor}) {
  let nodesIndex = {};

  let force = d3.layout.force()
    .size([width,height]);

  // let center = {
  //   x: radius,
  //   y: radius,
  // };

  let centerDamper = 0.5, collideDamper = 0;

  let handlers = {
  };


  function update (nodes, center) {
    let income = d => d.income;


    function moveTowardsCenter (alpha) {
      return (d) => {
        let c = center(d);
        d.x = d.x + (c.x - d.x) * (centerDamper) * alpha;
        d.y = d.y + (c.y - d.y) * (centerDamper) * alpha;
      };
    }


    force.nodes(nodes);

    force.gravity(gravity)
      .charge(d => -Math.pow(radiusScale(d.income), 2.0))
      // .charge(d => -radiusScale(d.income) * 15)
      .friction(0.9)

    let s = radius
    let radiusScale = d3.scale.linear().domain([0, maxAmount]).range([s/50, s/3])

    nodes.forEach(node => {
      if (node.x == null || node.y == null) {
        let r = Math.random() * (radius - radiusScale(node.income));
        let a = Math.random() * Math.PI * 2;
        [node.x,node.y] = pol2cart(r, a, radius, radius);
      }
    });

    // data.forEach(d => {
    //   // let bubbleRadius= = (((d.income / avgPowAmount) * radius) /  data.length) * 2e9
    //   let bubbleRadius = radiusScale(income);

    //   //radiusScale(d.income);

    //   if (!(d.id in nodesIndex)) {
    //     let r = Math.random() * (radius - bubbleRadius);
    //     let a = Math.random() * Math.PI * 2;
    //     let [x,y] = pol2cart(r, a, radius, radius);
    //     nodesIndex[d.id] = {id: d.id, x, y};
    //     nodes.push(nodesIndex[d.id]);
    //   }

    //   let node = nodesIndex[d.id];

    //   _.extend(
    //     node,
    //     {
    //       radius: bubbleRadius,
    //       subData: d.subData,
    //       data: d,
    //     });
    // });


    let nodeEls = container.selectAll('.node')
      .data(nodes, d => d.id);


    let enter = nodeEls.enter().append('g')
      .attr('class', 'node')
      // .attr('opacity', 0);

    // nodeEls.exit()
    //   .transition().duration(2000).attr('transform', 'scale(0)').attr('opacity', 0).remove();

    nodeEls.exit().remove();



    enter.append('circle')
      .attr('r', d => radiusScale(d.income))
      .attr('stroke-width', 2)
      .attr('fill', fillColor)
      .attr('aria-label', (d,i) => {
        let inSubSectorView = !!d.strata;
        if (inSubSectorView) {
          return `Sub-sector ${d.subSector} and income band ${d.strata} with total income ${formatMoney(d.income)} and total spending ${formatMoney(d.expend)} (${formatCount(d.count)} organisations)`;
        } else {
          return `Sub-sector ${d.subSector} with total income ${formatMoney(d.income)} and total spending ${formatMoney(d.expend)} (${formatCount(d.count)} organisations)`;
        }
      })
      .on('click', function (d,i) { handlers['click'] && handlers['click'].call(this, d,i) })
      .on('mouseover', function (d,i)  {
        handlers['mouseover'] && handlers['mouseover'].call(this, d,i)
      })
      .on('mousemove', function (d,i)  {
        handlers['mousemove'] && handlers['mousemove'].call(this, d,i)
      })
      .on('mouseout', function (d,i) { handlers['mouseout'] && handlers['mouseout'].call(this, d,i) });
    // .on('click', (d,i) => handlers.select(d.data, i, depth));

    // nodeEls.transition().duration(2000).attr('opacity', 1);

    // Resolves collisions between d and all other circles.
    let padding = 20;
    function collide(alpha) {
      var quadtree = d3.geom.quadtree(nodes);
      return function(d) {
        var radius = radiusScale(d.income);
        var r = radius + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = radius + radiusScale(quad.point.income) + padding;
            if (l < r) {
              l = (l - r) / l * alpha * collideDamper;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2
            || x2 < nx1
            || y1 > ny2
            || y2 < ny1;
        });
      };
    }

    force.on("tick", (e) => {
      nodeEls
        .each(collide(e.alpha))
        .each(moveTowardsCenter(e.alpha))
        .attr('transform', d => {
          return `translate(${d.x}, ${d.y})`
        });
    })

    nodeEls
      .attr('transform', d => {
        return `translate(${d.x}, ${d.y})`
      });

    // // nodeEls
    //   .attr('transform', d => {
    //     let c = center(d);
    //     return `translate(${c.x}, ${c.y})`
    //   });

    force.start();

    return self;
  };

  function on(event, handler) {
    handlers[event] = handler;
    return self;
  }

  let self = {update, on};
  return self;
}

export function sum(list, iterator=_.identity) {
  iterator = _.iteratee(iterator);
  return list.reduce((memo, item) => memo + iterator(item), 0);
}

function agrregateBy(data, key) {
  let grouped = _.groupBy(data, key);
  return _.map(grouped, (lines, name) => ({
    id: key + '-' + name,
    name,
    [key]: name,
    income: sum(lines, d => parseFloat(d.income)),
    expend: sum(lines, d => parseFloat(d.expend)),
    count: sum(lines, d => parseInt(d.count, 10)),
  }));
}

function gridLabels({data, container, center}) {
  function update(visible) {
    let labelEls = container.selectAll('.label').data(data);
    labelEls.enter()
       .append('text').text(d => d.subSector).attr('text-anchor', 'middle').attr('class', 'label')
      //.append('circle').attr('r', 3).attr('stroke', 'red').attr('class', 'label');
    labelEls.exit().remove();

    labelEls
      .transition()
      .duration(visible ? 2000 : 0)
      .attr('font-family', 'sans-serif')
      .attr('fill', '#666')
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('transform', d => {
        let c = center(d);
        return `translate(${c.x}, ${c.y})`;
      })
      // .attr('x', d => center(d).x)
      // .attr('y', d => center(d).y)
      .attr('opacity', visible ? 1 : 0);

    return self;
  }
  let self = {update};
  return self;
}

function loadedData(sectorStrata) {
  let radius = 300;
  let width = 810, height = 1200;
  let root = d3.select('#bubbles');
  let center = {x: width/2, y: 300};

  let subSectorIndex = _.mapObject(_.invert(_.uniq(_.pluck(sectorStrata, 'subSector'))), parseInt);

  let subSectorNodes = agrregateBy(sectorStrata, 'subSector');
  let strataNodes = sectorStrata.map(d => {
    return {
      id: d.subSector + '-' + d.strata,
      name: d.strata,
      subSector: d.subSector,
      strata: d.strata,
      income: parseFloat(d.income),
      expend: parseFloat(d.expend),
      count: parseInt(d.count, 10),
    };
  });


  let fillRange = d3.scale.linear()
      .domain([0, _.size(subSectorIndex)]).range(["#D3ECE7", "#8ACAC0"]);
  let fillColor = d => fillRange(subSectorIndex[d.subSector]);

  // let subSectorNodes = _.groupBy(sectorStrata, 'subSector').map((stratas, subSector) => {

    // let


    //   // let bubbleRadius= = (((d.income / avgPowAmount) * radius) /  data.length) * 2e9
    //   let bubbleRadius = radiusScale(income);

  //   //radiusScale(d.income);

  //   if (!(d.id in nodesIndex)) {
  //     let r = Math.random() * (radius - bubbleRadius);
  //     let a = Math.random() * Math.PI * 2;
  //     let [x,y] = pol2cart(r, a, radius, radius);
  //     nodesIndex[d.id] = {id: d.id, x, y};
  //     nodes.push(nodesIndex[d.id]);
  //   }

  //   let node = nodesIndex[d.id];

    //   _.extend(
    //     node,
    //     {
    //       radius: bubbleRadius,
    //       subData: d.subData,
    //       data: d,
    //     });
    // });


  const COLS = 4;

  function rowAndCol(d) {
    let sIndex = subSectorIndex[d.subSector];
    let col = (sIndex % COLS);
    let row = Math.floor(sIndex / COLS);
    return [row, col];
  }

  function strataCenter (d) {
    let [row, col] = rowAndCol(d);
    return {x: col * 180 + 130, y: row * 220 + 140};
  }

  // Should be the same as strataCenter, hacking to work round issues
  function labelsCenter (d) {
    let [row, col] = rowAndCol(d);

    // Horrible hack
    let adjustRow = [-30, -10, 10, 20, 40];
    let adjustCol = [-20, 2, 15, 30]

    return {x: col * 180 + 130 + adjustCol[col], y: row * 220 + 140 + adjustRow[row] + 90};
  }


  function stratas() {
    let indexed = _.groupBy(strataNodes, 'subSector');
    subSectorNodes.forEach(n => {
      let parents = indexed[n.subSector];
      n.px = n.x = d3.mean(parents, d => d.x);
      n.py = n.y = d3.mean(parents, d => d.y);
    });

    vis.update(subSectorNodes, d => center);

    labels.update(false);

    subSectorsButton.style({
      'background-color': 'white',
      'color': '#522574',
    });
    stratasButton.style({
      'background-color': '#522574',
      'color': 'white',
    });
  }

  function subSectors() {
    let indexed = _.indexBy(subSectorNodes, 'subSector');
    strataNodes.forEach(n => {
      let parent = indexed[n.subSector];
      let noise = () => Math.random() * 50 - 25;
      n.px = n.x = parent.x + noise();
      n.py = n.y = parent.y + noise();
    });
    vis.update(strataNodes, strataCenter);

    labels.update(true);

    subSectorsButton.style({
      'background-color': '#522574',
      'color': 'white',
    });
    stratasButton.style({
      'background-color': 'white',
      'color': '#522574',
    });
  }

  let buttons = root.append('div');
  let stratasButton = buttons.append('button')
      .text('ALL')
      .on('click', stratas);
  let subSectorsButton = buttons.append('button')
    .text('BY SUB-SECTOR')
    .on('click', subSectors);

  buttons.selectAll('button')
    .style({
      'margin-right': '8px',
      'background-color': 'white',
      'border': '1px solid #522574',
      'color': '#522574',
      'font-size': '14px',
      'font-family': 'sans-serif',
      'padding-top': '5px',
      'padding-bottom': '5px',
      'padding-left': '20px',
      'padding-right': '20px',
      'text-transform': 'uppercase',
    })


  let bubbleContainer = root.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    // .attr('transform', `translate(${width/2}, ${height/2})`);

  let labels = gridLabels({data: subSectorNodes, container: bubbleContainer, center: labelsCenter});

  let popover = root.append('div')
      .style({
        'font-family': 'museo-sans, helventica, sans-serif',
        'padding-left': '18px',
        'padding-right': '18px',
        'padding-top': '16px',
        'padding-bottom': '14px',
        border: '1px solid #94BFB7',
        'border-radius': '2px',
        'background-color': '#ffffff',
        'color': '#645C5D',
        'font-size': '16px',
        'line-height': '23px',
      });

  function updatePopover(fields) {
    let fieldEls = popover.selectAll('div').data(fields);
    fieldEls.exit();
    let enter = fieldEls.enter()
        .append('div');
    enter.append('span').attr('class', 'name').style({color: '#706F6F'});
    enter.append('span').attr('class', 'value').style({'font-weight': 'bold', color: '#522977'})
    fieldEls.select('.name').text(d => d.name + ': ');
    fieldEls.select('.value').text(d => d.value);

    popover.style({
      position: 'absolute',
      display: 'block',
    });
  }





  let vis = bubblesVis({container: bubbleContainer, width, height, subSectorIndex, radius, maxAmount: d3.max(subSectorNodes, d => d.income), fillColor})
      .on('mouseover', function (d, i) {
        let inSubSectorView = !!d.strata;
        d3.selectAll('.node').attr("stroke", (dd,ii) => {
          if (inSubSectorView) {
            return (dd.strata === d.strata) ? "#94BFB7" : 'none'
          } else {
            return (d === dd) ? "#94BFB7" : 'none';
          }
        });


        updatePopover([
          (inSubSectorView ? {name: 'Income band', value: d.strata} : {name: 'Sub-Sector', value: d.subSector}),
          {name: 'Total income', value: formatMoney(d.income)},
          {name: 'Total spending', value: formatMoney(d.expend)},
          {name: 'Number of organisations', value: formatCount(d.count)},
        ]);
      })
      .on('mousemove', () => {
        let [x,y] = d3.mouse(root[0][0]);
        popover.style({
          left: (x+20) + 'px',
          top: (y+20) + 'px',
        });
      })
      .on('mouseout', function (d, i) {
        d3.selectAll('.node').attr("stroke", 'none');
        popover.style({
          display: 'none',
        });
      });

  stratas();
}


function bubbles (config) {
  d3.csv(config.dataRoot + 'sub-sector-strata.csv', loadedData);
}

window.bubbles = bubbles;

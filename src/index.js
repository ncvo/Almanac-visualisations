import d3 from 'd3';
import _ from 'underscore'

let app = document.querySelector('#app')

app.innerHTML = '<h2>Welcome to bubbles</h2>'

export function pol2cart(r, a, cx=0, cy=0) {
  let x = cx + r * Math.cos(a);
  let y = cy + r * Math.sin(a);
  return [x,y];
}

function bubblesVis({data, container, depth=0, gravity=-0.01, radius=300}) {


  let nodes = [];
  let nodesIndex = {};

  let force = d3.layout.force()
    .nodes(nodes)
    .size([radius*2, radius*2]);

  let center = {
    x: radius,
    y: radius,
  };

  let damper = 0.1;

  let handlers = {
    select: () => null
  };

  function moveTowardsCenter (alpha) {
    return (d) => {
      d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
      d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
    };
  }

  function update (data) {
    let maxAmount = d3.max(data, (d) => d.income);
    let avgAmount = d3.mean(data, (d) => d.income);


    // let xx = Math.sqrt(d3.mean(data, (d) => Math.pow(d.income, 2))/data.length);
    // xx = (xx/675760539)*(radius/3);
    // console.log(xx);

    // console.log(s);
    // let radiusScale = d3.scale.linear().domain([0, maxAmount]).range([0, xx])
    let s = radius


    force.gravity(gravity)
      .charge(d => -Math.pow(d.radius, 2.0) / 4)
      .friction(0.9)

    // for(let i = 0; i < 2; i++) {
      let radiusScale = d3.scale.linear().domain([0, maxAmount]).range([s/50, s/3])
    //let radiusScale = d3.scale.log().domain([0.01, maxAmount]).range([0, s/10])

      data.forEach(d => {
        // let bubbleRadius= = (((d.income / avgPowAmount) * radius) /  data.length) * 2e9
        let bubbleRadius = radiusScale(d.income);

        console.log(d.income, maxAmount, bubbleRadius);
        //radiusScale(d.income);

        if (!(d.id in nodesIndex)) {
          let r = Math.random() * (radius - bubbleRadius);
          let a = Math.random() * Math.PI * 2;
          let [x,y] = pol2cart(r, a, radius, radius);
          nodesIndex[d.id] = {id: d.id, x, y};
          nodes.push(nodesIndex[d.id]);
        }

        let node = nodesIndex[d.id];

        _.extend(
          node,
          {
            radius: bubbleRadius,
            subData: d.subData,
            data: d,
          });
      });


    //   force.on("tick", (e) => {
    //     nodes.forEach(moveTowardsCenter(e.alpha));
    //   });

    //   force.start();
    //   _.times(100, () => force.tick());


    //   let maxR = d3.max(nodes, n => {
    //     let x = n.x - radius;
    //     let y = n.y - radius;
    //     return Math.sqrt(x*x + y*y) + n.radius;
    //   });
    //   console.log(radius, maxR);
    //   s = s * (radius/maxR);
    //   console.log('s', s);
    // }


    let nodeEls = container.selectAll('.node')
      .data(nodes, d => d.id);


    let enter = nodeEls.enter().append('g')
      .attr('class', 'node');

    nodeEls.exit()
      .transition().duration(2000).attr('transform', 'scale(0)').attr('opacity', 0).remove();

    enter.append('circle')
      .attr('r', d => d.radius)
      .attr('stroke-width', 2)
      .attr('fill', ["#A9AF5E", "#D7D8B0", "red"][depth])
      .on('click', (d,i) => handlers.select(d.data, i, depth));

    nodeEls
      .each(function (d) {
        if (d.subData) {
          d.sub = d.sub || bubblesVis({container: d3.select(this), depth: depth+1, radius: d.radius});
          d.sub.on('select', (...args) => handlers.select(...args))
          d.sub.update(d.subData);
        }
      })

    nodeEls.transition().duration(2000);

    force.on("tick", (e) => {
        nodeEls.each(moveTowardsCenter(e.alpha))
          .attr('transform', d => {
            return `translate(${d.x-radius}, ${d.y-radius})`
          });
      })

        nodeEls
          .attr('transform', d => {
            return `translate(${d.x-radius}, ${d.y-radius})`
          });

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
    income: sum(lines, d => parseFloat(d.income)),
    expend: sum(lines, d => parseFloat(d.expend)),
  }));
}

function loadedData(sectorStrata) {
  let data = agrregateBy(sectorStrata, 'subSector')
    .map(s => {
      return {
        ...s,
        //subData: agrregateBy(_.where(sectorStrata, {subSector: s.name}), 'strata')
      };
    });

  let width = 800, height = 600;
  let container = d3.select('#app').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width/2}, ${height/2})`);

  let vis = bubblesVis({container})
    .on('select', (d, i, depth) => {
      if (depth === 1) {
        // d3.csv(`data/sub-sector-strata-${i}.csv`, subData => {
        //   d.subData = subData.map(sd => ({
        //     id: 'sub-' + sd.name,
        //     name: sd.name,
        //     income: parseFloat(sd.income),
        //     expend: parseFloat(sd.expend),
        //   }))
        //   // console.log(d, i, depth);
        //   vis.update(data);
        // });
      }
    })
    .update(data);
}

d3.csv('data/sub-sector-strata.csv', loadedData);

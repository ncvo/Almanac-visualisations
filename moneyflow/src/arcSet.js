import d3 from 'd3';
import _ from 'underscore';

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


function arrowHeads({arcWidth, center, radius, right}) {
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

export default function arcSet({
  center=d => [0,0],
  innerRadius=d => 227,
  arcWidth=44,
  endCaps=false,
  clockwise=(d,i) => true,
  right=(d,i) => true,
  progress=(d,i) => 1,
  ring=(d,i) => i,
  tipRadius=(d,i) => 20,
  fill=(d,i) => 'red',
  animateIn=(d,i) => false,
  mouseover,
  mouseout,
  click,
  opacity=d => 1,
  animationDelay=0,
}={}) {

  // let arc = arcIndictator({
  //   center,
  //   innerRadius: (d,i) => innerRadius + i * arcWidth,
  //   arhWidth: d => arcWidth,
  // });

  let id = _.uniqueId();

  let first = true;

  if (endCaps) {
    let arrows = arrowHeads({center, radius: (d,i) => innerRadius(d,i) + arcWidth * i, right, arcWidth});
  }

  function update(container) {
    let angle = (d,i) => {
      return (1-progress(d,i)) * -180;
    };

    let selector = container.selectAll('.arc').data(d => {
      return d
    });
    selector.exit().remove();
    let enter = selector.enter()
      .append('g').attr('class', 'arc')

    // enter.append('defs').append('marker',
    enter.append('g').attr('class', 'arc-outer')
      .append('g').attr('class', 'arc-inner')
        .attr('transform', (d,i) => {
          let [x,y] = center(d,i);
          let startAngle = animateIn(d,i) ? -180 : angle(d,i);
          return `translate(${x}, ${y}) rotate(${startAngle})`;
        })
      .append('path')
      .attr('fill', (d,i) => {
        return fill(d,i);
      });

    enter.append("clipPath")
      .attr("id", (d,i) => `arc-clip-${id}-${i}`)
      .append("rect");



    // enter.append('path').attr('class', 'endCap');

    // selector.select('.endCap')
    //   .attr('class', 'endCap')
    //   .attr('fill', 'red')
    //   .attr('d', (d,i) => {
    //     return `
    //     M ${left} ${top+lineHeight*i-15}
    //     L ${left} ${top+lineHeight*(i+1)+15}
    //     L ${left+(40*direction)} ${top+lineHeight*(i+0.5)}
    //     Z
    //     `;
    //   });




    selector.select('clipPath rect')
      .attr("x", (d,i) => center(d,i)[0])
      .attr("y", (d,i) => center(d,i)[1] - (innerRadius(d,i) + arcWidth * (i+1)))
      .attr("width", (d,i) => innerRadius(d,i) + arcWidth * (i+1))
      .attr("height", (d,i) => 2*(innerRadius(d,i) + arcWidth * (i+1)));

    selector.select('g.arc-outer')
      .attr('transform', (d, i) => {
        let t = '';
        // if ((!right && clockwise) || (right && !clockwise)) {
        if (!right(d,i)) {
          t += `rotate(180) `;
        }
        if (!clockwise(d,i)) {
          t += `scale(1, -1) `;
        }
        return t;
      })
      .attr("clip-path", (d,i) => `url(#arc-clip-${id}-${i})`);

    selector.select('.arc-outer')
      .transition()
      .duration(300)
      .style('opacity', opacity);


    selector.select('g.arc-inner')
      .transition()
      .delay((first ? 1500 : 0) + animationDelay)
      .duration(function (d,i) {
        return 600;
        // let currentTransform = this.getAttribute('transform');
        // let [,rotate] = /rotate\((.+)\)/.exec(currentTransform);
        // rotate = parseFloat(rotate);
        // rotate = -rotate + angle(d,i);
        // return ((rotate)/180)*1000;
      })
      .attr('transform', (d,i) => {
        let [x,y] = center(d,i);
        return `translate(${x}, ${y}) rotate(${angle(d,i)})`;
      });


    selector.select('path')
      .on('mouseover', mouseover)
      .on('mouseout', mouseout)
      .on('click', click)
      .attr('stroke-width', 0.3)
      .attr('stroke', 'white')
      .attr('d',  (d,i) => {
        let r = innerRadius(d,i) + ring(d,i) * arcWidth;
        let [cx,cy] = [0,0];
        let [innerEx, innerEy] = pol2cart(r, Math.PI/2, cx, cy);
        let [innerSx, innerSy] = pol2cart(r, Math.PI*1.5, cx, cy);
        let [outerEx, outerEy] = pol2cart(r+arcWidth+1, Math.PI/2, cx, cy);
        let [outerSx, outerSy] = pol2cart(r+arcWidth+1, Math.PI*1.5, cx, cy);
        let pointerAngle = tipRadius(d,i)/(r+(arcWidth/2));
        let [ex, ey] = pol2cart(r+(arcWidth/2), Math.PI/2+pointerAngle, cx, cy);
        let [capx1, capy1] = pol2cart(r-(arcWidth/2), Math.PI/2, cx, cy);
        let [capx2, capy2] = pol2cart(r+(arcWidth*1.5), Math.PI/2, cx, cy);

        return `
          M ${innerSx} ${innerSy}
          A ${r} ${r} 0 0 1 ${innerEx} ${innerEy}
          ${ (endCaps) ? `L ${capx1} ${capy1}` : ''}
          L ${ex} ${ey}
          ${ (endCaps) ? `L ${capx2} ${capy2}` : ''}
          L ${outerEx} ${outerEy}
          A ${r+arcWidth} ${r+arcWidth} 0 0 0 ${outerSx} ${outerSy}
          Z
        `;
      })
      .transition()
      .duration(300)
      .attr('fill', (d,i) => {
        return fill(d,i);
      })

    first = false;
  }

  return update;
}

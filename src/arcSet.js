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

export default function arcSet({
  center=d => [0,0],
  innerRadius=d => 227,
  arcWidth=44,
  clockwise=(d,i) => true,
  right=(d,i) => true,
  progress=(d,i) => 1,
  ring=(d,i) => i,
  tipRadius=(d,i) => 20,
  fill=(d,i) => 'red',
  animateIn=(d,i) => false,
}={}) {

  // let arc = arcIndictator({
  //   center,
  //   innerRadius: (d,i) => innerRadius + i * arcWidth,
  //   arhWidth: d => arcWidth,
  // });

  let id = _.uniqueId();

  function update(container) {
    let angle = (d,i) => (1-progress(d,i)) * -180

    let selector = container.selectAll('.arc').data(d => {
      return d
    });
    selector.exit().remove();
    let enter = selector.enter()
      .append('g').attr('class', 'arc')

    // enter.append('defs').append('marker',
    enter.append('g').attr('class', 'arc-outer').append('g').attr('class', 'arc-inner').append('path');

    enter.append("clipPath")
      .attr("id", (d,i) => `arc-clip-${id}-${i}`)
      .append("rect");

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
        console.log(t);
        return t;
      })
      .attr("clip-path", (d,i) => `url(#arc-clip-${id}-${i})`);

    selector.select('g.arc-inner')
      .attr('transform', (d,i) => {
        let [x,y] = center(d,i);
        let startAngle = animateIn(d,i) ? -180 : angle(d,i);
        return `translate(${x}, ${y}) rotate(${startAngle})`;
      });


    selector.select('g.arc-inner')
      .transition()
      .duration(function (d,i) {
        let currentTransform = this.getAttribute('transform');
        console.log(currentTransform);
        let [,rotate] = /rotate\((.+)\)/.exec(currentTransform);
        rotate = parseFloat(rotate);
        rotate = -rotate + angle(d,i);
        return ((rotate)/180)*1000;
      })
      .attr('transform', (d,i) => {
        let [x,y] = center(d,i);
        return `translate(${x}, ${y}) rotate(${angle(d,i)})`;
      });

    selector.select('path')
      .attr('stroke-width', arcWidth+1)
      .attr('fill', (d,i) => {
        console.log(fill(d,i));
        return fill(d,i);
      })
      .attr('stroke', 'none')
      .attr('d',  (d,i) => {
        let r = innerRadius(d,i) + ring(d,i) * arcWidth;
        let [cx,cy] = [0,0];
        let [innerEx, innerEy] = pol2cart(r, Math.PI/2, cx, cy);
        let [innerSx, innerSy] = pol2cart(r, Math.PI*1.5, cx, cy);
        let [outerEx, outerEy] = pol2cart(r+arcWidth+1, Math.PI/2, cx, cy);
        let [outerSx, outerSy] = pol2cart(r+arcWidth+1, Math.PI*1.5, cx, cy);
        let pointerAngle = tipRadius(d,i)/(r+(arcWidth/2));
        let [ex, ey] = pol2cart(r+(arcWidth/2), Math.PI/2+pointerAngle, cx, cy);
        return `
          M ${innerSx} ${innerSy}
          A ${r} ${r} 0 0 1 ${innerEx} ${innerEy}
          L ${ex} ${ey}
          L ${outerEx} ${outerEy}
          A ${r+arcWidth} ${r+arcWidth} 0 0 0 ${outerSx} ${outerSy}
          Z
        `;
      })

  }

  return update;
}

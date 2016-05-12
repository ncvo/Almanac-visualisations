// the info box at the top of the graph that shows in the income labels
import d3 from 'd3';
import _ from 'underscore';
import infoItems from './infoItems';
import startDots from './startDots';

export default function infoBox({width, bottom, lineHeight, values, borderColor, dotFill}) {
  let info = infoItems({bottom, lineHeight});
  let dots = startDots({dotFill, bottom, lineHeight});

  return function update(container) {
    let selector = container.selectAll('.infoBox').data((d,i) => {
      return [values(d,i)];
    });

    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'infoBox')
    enter.append('rect');
    enter.append('line');


    selector.select('rect')
      .attr('x', -width)
      .attr('y', d => bottom - lineHeight * d.length)
      .attr('width', width)
      .attr('height', d => lineHeight * d.length)
      .attr('fill', 'white')
      .style({opacity: 0.7});


    selector.select('line')
      .attr('x1',-width).attr('y1', d => bottom - lineHeight * d.length)
      .attr('x2',-width).attr('y2', bottom)
      .attr('stroke-width', '16')
      .attr('stroke', borderColor);


    selector.call(info);
    selector.call(dots);
  };
}

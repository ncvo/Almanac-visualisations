// the info box at the top of the graph that shows in the income labels
import d3 from 'd3';
import _ from 'underscore';
import infoItems from './infoItems';
import startDots from './startDots';
import detailsList from './detailsList';


export default function infoBox({width, bottom, top, lineHeight, values, borderColor, dotFill}) {
  let info = infoItems({bottom, lineHeight, left: -212});
  let detailsHeading = infoItems({top, lineHeight, fontSize: 15});
  let details = detailsList({top: top + lineHeight, lineHeight: lineHeight / 2, fontSize: 12, left: -212});
  let dots = startDots({dotFill, bottom, lineHeight});

  let lastHighlighted;

  return function update(container, highlighted) {
    let selector = container.selectAll('.infoBox').data((d,i) => {
      return [values(d,i)];
    });

    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'infoBox')
    enter.append('rect');
    enter.append('line');
    enter.append('g').attr('class', 'list');
    let detailsEnter = enter.append('g').attr('class', 'details');


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

    selector.select('.list')
      .call(info)
      .transition()
      .duration(400)
      .delay(highlighted ? 0 : 200)
      .style('opacity', (highlighted == null) ? 1 : 0);

    selector.select('.details')
      .data((d,i) => (highlighted || lastHighlighted) ?[[highlighted || lastHighlighted]] : [], d => 1)
      .call(detailsHeading)
      .call(details)
      .transition()
      .duration(400)
      .delay(highlighted ? 200 : 0)
      .style('opacity', (highlighted == null) ? 0 : 1);

    selector.call(dots);

    lastHighlighted = highlighted;
  };
}

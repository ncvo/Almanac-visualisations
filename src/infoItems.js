// List of funding sources and amounts as text with icons. Used in infoBox
import d3 from 'd3';
import _ from 'underscore';

export default function infoItems({lineHeight, left=-212, bottom, top, fontSize=13, iconHeight=45}) {
  if (top != null) {
    bottom = top;
    lineHeight = -lineHeight;
  }

  return function update(container, highlighted) {
    let items = container.selectAll('.item').data(d => d);
    items.exit().remove();
    let itemsEnter = items.enter().append('g').attr('class', 'item');
    itemsEnter.append('image');
    itemsEnter.append('text').attr('class', 'label');
    itemsEnter.append('text').attr('class', 'amount');

    // WARNING: This assumes only 1 set!
    let data = container.data()[0];

    let transform = (d, i) => {
      return `translate(0, ${bottom - ((i + 0.5) * lineHeight)})`;
    };

    items
      .attr('transform', transform)
      .transition()
      .style('opacity', d => (highlighted == null || highlighted === d) ? 1 : 0);

    let iconSpacing = 30;

    items.select('image')
      .attr('x', left)
      .attr('y', -iconHeight/2 - 5)
      .attr('width', iconHeight)
      .attr('height', iconHeight)
      .attr('xlink:href', d => d.icon);

    items.selectAll('text')
      .attr('fill', '#70706F')
      .style({opacity: 0.9})
      .attr('font-family', 'sans-serif')
      .attr('font-size', fontSize);

    items.select('.label')
      .attr('dx', left + iconHeight + iconSpacing)
      .attr('dy', '-0.5em')
      .text(d => d.label);

    let format = d3.format(",.2r");
    items.select('.amount')
      .attr('dx', left + iconHeight + iconSpacing)
      .attr('dy', '+0.5em')
      .attr('font-weight', 'bold')
      .text(d => '£' + format(d.value) + 'bn');
  }
}

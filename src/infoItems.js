// List of funding sources and amounts as text with icons. Used in infoBox
import d3 from 'd3';
import _ from 'underscore';

export default function infoItems({lineHeight, left=-140, bottom=0, fontSize=13}) {
  return function update(container) {
    let items = container.selectAll('.item').data(d => d);
    items.exit().remove();
    let itemsEnter = items.enter().append('g').attr('class', 'item');
    itemsEnter.append('circle');
    itemsEnter.append('text').attr('class', 'label');
    itemsEnter.append('text').attr('class', 'amount');

    items
      .attr('transform', (d, i) => `translate(0, ${bottom - ((i + 0.5) * lineHeight)})`)

    // items.select('circle')
    //   .attr('r', 5)
    //   .attr('fill', dotFill)
    //   .attr('cx', 12)
    //   .attr('cy', 0);

    items.selectAll('text')
      .attr('fill', '#70706F')
      .style({opacity: 0.9})
      .attr('font-family', 'sans-serif')
      .attr('font-size', fontSize);

    items.select('.label')
      .attr('dx', left)
      .attr('dy', '-0.5em')
      .text(d => d.label);

    let format = d3.format(",.2f");
    items.select('.amount')
      .attr('dx', left)
      .attr('dy', '+0.5em')
      .attr('font-weight', 'bold')
      .text(d => '£' + d.value + 'bn');
  }
}

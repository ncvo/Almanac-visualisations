import d3 from 'd3';
import _ from 'underscore';

export default function detailsList({top, lineHeight, fontSize, left}) {
  return function update(container) {
    let selector = container.selectAll('.detailLine').data((d,i) => {
      // WARNING: BROKEN
      return d.map(d => d.breakdown)[0];
    });

    selector.exit().transition().style('opacity', 0).remove();
    let enter = selector.enter().append('g').attr('class', 'detailLine');
    enter.append('text').attr('class', 'label');
    enter.append('text').attr('class', 'amount');

    selector
      .attr('transform', (d,i) => `translate(${left}, ${top + lineHeight * (i + 0.5)})`);

    selector.selectAll('text')
      .attr('fill', '#70706F')
      .style({opacity: 0.9})
      .attr('font-family', 'sans-serif')
      .attr('font-size', fontSize);

    let format = d3.format(",.2r");
    selector.select('.label').text(d => d.label ? d.label : "Misc")
    selector.select('.amount')
      .text(d => '£' + format(d.value) + 'bn').attr('dx', 160)
      .attr('font-weight', 'bold');
  };
}

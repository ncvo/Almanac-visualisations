import d3 from 'd3';
import _ from 'underscore';

export default function startDots({dotFill, bottom, top, left=12, lineHeight}) {
  if (bottom != null && top != null) throw Error("Should only have one of bottom or top specified");

  let start;
  if (bottom != null) {
    start = bottom;
  } else {
    start = top;
    lineHeight = -lineHeight;
  }

  return function update(container) {
    let dots = container.selectAll('.dot').data(d => d);
    dots.exit().remove();
    dots.enter().append('circle');
    dots.attr('class', 'dot')
      .attr('r', 5)
      .attr('fill', dotFill)
      .attr('cx', left)
      .attr('cy', (d,i) => start - ((i + 0.5) * lineHeight));
  };
}

// Info shown after the output lines,

function outputInfo({values, top, lineHeight, arrowFill}) {
  // infoItems grows from the bottom, but we can give a negative
  // lineHeight to have it grow from the top
  let info = infoItems({bottom: top, lineHeight: -lineHeight, left: 125, fontSize: 16});

  return function update(container) {
    let selector = container.selectAll('.outputInfo').data((d,i) => {
      return [values(d,i)];
    });

    selector.exit().remove();
    let enter = selector.enter().append('g').attr('class', 'outputInfo')

    selector.call(info);

    let arrowHeads = selector.selectAll('.arrowHeads').data(d => d);
    arrowHeads.exit().remove();
    arrowHeads.enter().append('path');
    arrowHeads
      .attr('fill', arrowFill)
      .attr('d', (d,i) => {
        return `
        M 0 ${top+lineHeight*i-15}
        L 0 ${top+lineHeight*(i+1)+15}
        L 40 ${top+lineHeight*(i+0.5)}
        Z
        `;
      });
  };
}

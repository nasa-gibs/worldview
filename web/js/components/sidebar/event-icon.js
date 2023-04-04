import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
// import { Tooltip } from 'reactstrap';

export default function EventIcon ({
  id, category, title, hideTooltip, isSelected,
}) {
  const tooltipContainerRef = useRef();
  // const [tooltipOpen, setTooltipOpen] = useState(false);
  const slug = category.toLowerCase().split(' ').join('-');
  const tooltipId = `tooltip-${slug}-${id}`;
  const tooltipArrowId = `arrow-${tooltipId}`;

  // const toggle = ({ buttons }) => {
  //   const open = buttons ? false : !tooltipOpen;
  //   setTooltipOpen(open);
  // };

  const handleEnter = (e) => {
    e.preventDefault();

    const containerRect = tooltipContainerRef.current.getBoundingClientRect();
    const divTooltip = document.getElementById(tooltipId);
    const divTooltipArrow = document.getElementById(tooltipArrowId);

    let arrowTop = '0px';
    let arrowLeft = '0px';
    let tooltipTop = '0px';
    let tooltipLeft = '0px';
    let wrappedText = 0;

    if (divTooltip.getBoundingClientRect().height > 30) {
      wrappedText = 10;
    }

    if (isSelected) {
      tooltipTop = `${containerRect.y - containerRect.height / 2 - wrappedText}px`;
      tooltipLeft = `${containerRect.x - containerRect.width / 2 - 30}px`;
      divTooltip.style.setProperty('top', tooltipTop);
      divTooltip.style.setProperty('left', tooltipLeft);

      const divTooltipRect = divTooltip.getBoundingClientRect();
      arrowTop = `${divTooltipRect.y + 5 - wrappedText}px`;
      arrowLeft = `${divTooltipRect.x + divTooltipRect.width / 2 - 10}px`;
      divTooltipArrow.style.setProperty('top', arrowTop);
      divTooltipArrow.style.setProperty('left', arrowLeft);
    } else {
      tooltipTop = (containerRect.y - containerRect.height / 2 - 20 - wrappedText) + 'px';
      tooltipLeft = (containerRect.x - containerRect.width / 2 - 54) + 'px';
      divTooltip.style.setProperty('top', tooltipTop);
      divTooltip.style.setProperty('left', tooltipLeft);

      const divTooltipRect = divTooltip.getBoundingClientRect();
      if (wrappedText > 0) {
        arrowTop = `${divTooltipRect.y + 5 + wrappedText + 3}px`;
      } else {
        arrowTop = `${divTooltipRect.y + 5 + wrappedText}px`;
      }
      arrowLeft = `${divTooltipRect.x + divTooltipRect.width/2 - 10}px`;
      divTooltipArrow.style.setProperty('top', arrowTop);
      divTooltipArrow.style.setProperty('left', arrowLeft);
    }

    divTooltip.style.setProperty('visibility', 'visible');
    divTooltipArrow.style.setProperty('visibility', 'visible');
  }

  const handleLeave = (e) => {
    const divTooltip = document.getElementById(tooltipId);
    divTooltip.style.setProperty('visibility', 'hidden');

    const divTooltipArrow = document.getElementById(tooltipArrowId);
    divTooltipArrow.style.setProperty('visibility', 'hidden');
  }

  useEffect(() => {
    const divTooltip = document.createElement('div');
    divTooltip.setAttribute('id', tooltipId);
    divTooltip.innerHTML = title || category;
    divTooltip.style.setProperty('width', '160px');
    divTooltip.style.setProperty('background', 'black');
    divTooltip.style.setProperty('color', 'white');
    divTooltip.style.setProperty('position', 'fixed');
    divTooltip.style.setProperty('z-index', '1000');
    divTooltip.style.setProperty('border-radius', '5px');
    divTooltip.style.setProperty('text-align', 'center');
    divTooltip.style.setProperty('padding', '5px');
    divTooltip.style.setProperty('visibility', 'hidden');

    const divTooltipArrow = document.createElement('div');
    divTooltipArrow.setAttribute('id', tooltipArrowId);
    divTooltipArrow.style.setProperty('background', '#000');
    divTooltipArrow.style.setProperty('border-radius', '2px');
    divTooltipArrow.style.setProperty('z-index', '1000');
    divTooltipArrow.style.setProperty('width', '20px');
    divTooltipArrow.style.setProperty('height', '20px');
    divTooltipArrow.style.setProperty('rotate', '45deg');
    divTooltipArrow.style.setProperty('position', 'fixed');
    divTooltipArrow.style.setProperty('visibility', 'hidden');

    document.body.appendChild(divTooltipArrow);
    document.body.appendChild(divTooltip);
    return (() => {
      divTooltip.remove();
      divTooltipArrow.remove();
    });
  });

  return (
    <div ref={tooltipContainerRef} onMouseEnter={(e) => handleEnter(e)} onMouseLeave={(e) => handleLeave(e)}>
      {/* <Tooltip
        id="center-align-tooltip"
        placement="top"
        target={id + slug}
        delay={{ show: 50, hide: 0 }}
        toggle={toggle}
        isOpen={!hideTooltip && tooltipOpen}
      >
        {title || category}
      </Tooltip> */}
      <i
        id={id + slug}
        className={`event-icon event-icon-${slug}`}
      />
    </div>
  );
}

EventIcon.propTypes = {
  id: PropTypes.string,
  category: PropTypes.string,
  hideTooltip: PropTypes.bool,
  title: PropTypes.string,
};

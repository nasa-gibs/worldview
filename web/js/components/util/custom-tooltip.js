import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function CustomTooltip (props) {
  const {
    id,
    text,
    hideTooltip,
    isSelected,
    children,
  } = props;
  const tooltipContainerRef = useRef();
  const tooltipId = `tooltip-${id}`;
  const tooltipArrowId = `arrow-${tooltipId}`;

  const initialize = () => {
    const divTooltip = document.createElement('div');
    divTooltip.setAttribute('id', tooltipId);
    divTooltip.setAttribute('class', 'events-tooltip');
    divTooltip.innerHTML = text;

    const divTooltipArrow = document.createElement('div');
    divTooltipArrow.setAttribute('id', tooltipArrowId);
    divTooltipArrow.setAttribute('class', 'events-tooltip-arrow');

    let markerContainer = document.getElementById('marker-container');
    if (markerContainer === null) {
      markerContainer = document.createElement('div');
      markerContainer.setAttribute('id', 'marker-container');
      document.body.appendChild(markerContainer);
    }
    markerContainer.appendChild(divTooltipArrow);
    markerContainer.appendChild(divTooltip);

    return { divTooltip, divTooltipArrow };
  };

  const handleOnEnter = () => {
    if (hideTooltip) return;

    const containerRect = tooltipContainerRef.current.getBoundingClientRect();
    const divTooltip = document.getElementById(tooltipId);
    const divTooltipArrow = document.getElementById(tooltipArrowId);

    if (divTooltip === null) return;

    let divTooltipRect = divTooltip.getBoundingClientRect();
    const wrappedText = divTooltipRect.height > 30 ? 10 : 0;
    let tooltipTop = `${containerRect.y - containerRect.height / 2 - 20 - wrappedText}px`;
    let tooltipLeft = `${containerRect.x - divTooltipRect.width / 2 + 13}px`;
    if (isSelected) {
      tooltipTop = `${containerRect.y - containerRect.height / 2 - wrappedText - 10}px`;
      tooltipLeft = `${containerRect.x - divTooltipRect.width / 2 + 17}px`;
    }

    divTooltip.style.setProperty('top', tooltipTop);
    divTooltip.style.setProperty('left', tooltipLeft);

    divTooltipRect = divTooltip.getBoundingClientRect();
    const arrowTop = `${divTooltipRect.y + 5 + wrappedText + (wrappedText > 0 ? 3 : 0)}px`;
    const arrowLeft = `${divTooltipRect.x + divTooltipRect.width / 2 - 10}px`;
    divTooltipArrow.style.setProperty('top', arrowTop);
    divTooltipArrow.style.setProperty('left', arrowLeft);

    divTooltip.style.setProperty('visibility', 'visible');
    divTooltipArrow.style.setProperty('visibility', 'visible');
  };

  const handleOnLeave = () => {
    const divTooltip = document.getElementById(tooltipId);
    if (divTooltip === null) return;
    divTooltip.style.setProperty('visibility', 'hidden');

    const divTooltipArrow = document.getElementById(tooltipArrowId);
    divTooltipArrow.style.setProperty('visibility', 'hidden');
  };

  useEffect(() => {
    const { divTooltip, divTooltipArrow } = initialize();

    return () => {
      divTooltip.remove();
      divTooltipArrow.remove();
    };
  }, []);

  return (
    <div
      ref={tooltipContainerRef}
      onMouseEnter={handleOnEnter}
      onMouseLeave={handleOnLeave}
    >
      {children}
    </div>
  );
}

CustomTooltip.propTypes = {
  id: PropTypes.string,
  text: PropTypes.string,
  hideTooltip: PropTypes.bool,
  isSelected: PropTypes.bool,
};

export default CustomTooltip;

import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import SimpleBarReact from 'simplebar-react';

/**
 * Wrapper component for SimpleBar
 * @param {number} props.scrollBarVerticalTop - location to scroll to
 */
export default function Scrollbars(props) {
  const ref = useRef();

  /**
   * Add/remove the scrollbar-visible class if content is overflowing
   * @param {*} simpleBar
   */
  const toggleVisibleClass = (simpleBar) => {
    const { contentEl, contentWrapperEl } = simpleBar;
    if (contentEl.offsetHeight > contentWrapperEl.offsetHeight) {
      contentEl.classList.add('scrollbar-visible');
    } else {
      contentEl.classList.remove('scrollbar-visible');
    }
  };

  /**
   * Set the scrollTop position based on props.scrollBarVerticalTop
   * @param {*} simpleBar
   */
  const setScrollTop = (simpleBar) => {
    const { contentWrapperEl } = simpleBar;
    if (contentWrapperEl) {
      const verticalTop = Math.floor(props.scrollBarVerticalTop);
      contentWrapperEl.scrollTop = verticalTop !== 0
        ? verticalTop
        : contentWrapperEl.scrollTop;
    }
  };

  useLayoutEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    setTimeout(() => { toggleVisibleClass(ref.current); }, 100);
    setScrollTop(ref.current);
  });

  return (
    <SimpleBarReact
      autoHide={false}
      style={props.style}
      ref={ref}
    >
      {props.children}
    </SimpleBarReact>
  );
}

Scrollbars.propTypes = {
  children: PropTypes.node,
  scrollBarVerticalTop: PropTypes.number,
  style: PropTypes.object
};

Scrollbars.defaultProps = {
  scrollBarVerticalTop: 0
};

import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import SimpleBarReact from 'simplebar-react';

/**
 * Wrapper component for SimpleBar
 * @param {number} props.scrollBarVerticalTop - location to scroll to
 */
export default function Scrollbars(props) {
  const ref = props.scrollRef || useRef();

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

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    const { contentWrapperEl } = ref.current;
    if (props.onScroll) {
      contentWrapperEl.addEventListener('scroll', props.onScroll);
    }
    setTimeout(() => { toggleVisibleClass(ref.current); }, 50);
    setScrollTop(ref.current);
    return function cleanUp() {
      contentWrapperEl.removeEventListener('scroll', props.onScroll);
    };
  });

  return (
    <SimpleBarReact
      autoHide={false}
      style={props.style}
      className={props.className}
      ref={ref}
    >
      {props.children}
    </SimpleBarReact>
  );
}

Scrollbars.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  scrollBarVerticalTop: PropTypes.number,
  style: PropTypes.object
};

Scrollbars.defaultProps = {
  scrollBarVerticalTop: 0
};

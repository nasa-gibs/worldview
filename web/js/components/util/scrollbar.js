import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SimpleBarReact from 'simplebar-react';
import { debounce } from 'lodash';

/**
 * Wrapper component for SimpleBar
 */
export default function Scrollbars(props) {
  const ref = useRef();
  const [scrollTop, updateScrollTop] = useState(0);
  const {
    style,
    className,
    onScroll,
    children,
    scrollBarVerticalTop,
  } = props;

  /**
   * Add/remove 'scrollbar-visible' class based on content size
   */
  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    const { contentEl, contentWrapperEl } = ref.current;
    function toggleVisibleClass() {
      if (contentEl.offsetHeight > contentWrapperEl.offsetHeight) {
        contentEl.classList.add('scrollbar-visible');
      } else {
        contentEl.classList.remove('scrollbar-visible');
      }
    }
    debounce(() => {
      toggleVisibleClass();
      // If scrollbar contents are loaded asynchronously, we need to delay
      // comparing content/wrapper offsetHeights until the content has loaded.
      // It would be better to call this after some event or callback rather
      // than just guessing 800ms is long enough for content to load but this
      // seems to work pretty well enough for now.
      setTimeout(toggleVisibleClass, 800);
    }, 50, { leading: true, trailing: true })();
  });

  /**
   *  Set scroll top when prop changes
   */
  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    function setScrollTop() {
      const { contentWrapperEl } = ref.current;
      if (contentWrapperEl) {
        updateScrollTop(scrollBarVerticalTop);
        contentWrapperEl.scrollTop = scrollBarVerticalTop;
      }
    }
    setTimeout(setScrollTop, 100);
  }, [scrollBarVerticalTop]);

  /**
   * Handle register/deregister of scroll event listener
   */
  useEffect(() => {
    if (!onScroll) return;
    const { contentWrapperEl } = ref && ref.current;
    function scrollListener() {
      // Avoid calling event listener when we are setting scrollTop manually
      if (contentWrapperEl.scrollTop !== scrollTop) {
        onScroll(contentWrapperEl);
      }
    }
    contentWrapperEl.addEventListener('scroll', scrollListener);
    return function cleanUp() {
      contentWrapperEl.removeEventListener('scroll', scrollListener);
    };
  });

  return (
    <SimpleBarReact
      autoHide={false}
      style={style}
      className={className}
      ref={ref}
    >
      {children}
    </SimpleBarReact>
  );
}

Scrollbars.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  scrollBarVerticalTop: PropTypes.number,
  style: PropTypes.object,
};

Scrollbars.defaultProps = {
  scrollBarVerticalTop: 0,
};

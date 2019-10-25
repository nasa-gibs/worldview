import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import SimpleBarReact from 'simplebar-react';

export default function Scrollbars(props) {
  const ref = useRef();
  let scrollbarVisible;

  useLayoutEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    // if (ref.current.recalculate) {
    //   // TODO do we need to recalculate??
    //   ref.current.recalculate();
    // }

    const { contentEl, contentWrapperEl } = ref.current;
    if (contentEl) {
      const verticalTop = Math.floor(props.scrollBarVerticalTop);
      scrollbarVisible = contentEl.offsetHeight > contentWrapperEl.offsetHeight;
      contentWrapperEl.scrollTop = verticalTop !== 0 ? verticalTop : 0;

      if (scrollbarVisible) {
        contentEl.classList.add('scrollbar-visible');
      } else {
        contentEl.classList.remove('scrollbar-visible');
      }
    }
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

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function VisibilitySensor(props) {
  const {
    children,
    containment,
    partialVisibility,
  } = props;

  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries && entries.length ? entries[0] : null;
        setIsVisible(!!entry?.isIntersecting);
      },
      {
        root: containment || null,
        threshold: partialVisibility ? 0 : 1,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [containment, partialVisibility]);

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      {typeof children === 'function' ? children({ isVisible }) : children}
    </div>
  );
}

VisibilitySensor.defaultProps = {
  containment: null,
  partialVisibility: false,
};

VisibilitySensor.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  containment: PropTypes.oneOfType([
    PropTypes.instanceOf(Element),
    PropTypes.oneOf([null]),
  ]),
  partialVisibility: PropTypes.bool,
};

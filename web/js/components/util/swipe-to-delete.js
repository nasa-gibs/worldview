import { useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function SwipeToDelete(props) {
  const {
    children,
    deleteSwipe,
    item,
    onDelete,
  } = props;

  const containerRef = useRef(null);
  const pointerIdRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });
  const directionDecidedRef = useRef(false);
  const isHorizontalRef = useRef(false);

  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const getWidth = () => containerRef.current?.getBoundingClientRect()?.width || 0;

  const resetGesture = () => {
    pointerIdRef.current = null;
    directionDecidedRef.current = false;
    isHorizontalRef.current = false;
    setIsDragging(false);
    setTranslateX(0);
  };

  const onPointerDown = (e) => {
    // Only track primary pointer; allow scroll until we detect a horizontal swipe.
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    startRef.current = { x: e.clientX, y: e.clientY };
    directionDecidedRef.current = false;
    isHorizontalRef.current = false;
    setIsDragging(false);

    // Capture so we keep getting move/up even if pointer leaves.
    if (containerRef.current?.setPointerCapture) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;

    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!directionDecidedRef.current) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Don’t decide too early; small jitter should still allow vertical scroll.
      if (absDx < 10 && absDy < 10) return;

      directionDecidedRef.current = true;
      isHorizontalRef.current = absDx > absDy;
      setIsDragging(isHorizontalRef.current);
    }

    if (!isHorizontalRef.current) return;

    // We’re handling a horizontal swipe; prevent scrolling/selection.
    if (e.cancelable) e.preventDefault();

    // Only allow swipe left to delete.
    const nextTranslate = Math.min(0, dx);
    setTranslateX(nextTranslate);
  };

  const onPointerUp = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;

    if (isHorizontalRef.current) {
      const width = getWidth();
      const threshold = width * deleteSwipe;
      if (Math.abs(translateX) >= threshold && threshold > 0) {
        onDelete?.(item);
      }
    }

    resetGesture();
  };

  const onPointerCancel = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    resetGesture();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        touchAction: 'pan-y',
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 150ms ease-out',
      }}
    >
      {children}
    </div>
  );
}

SwipeToDelete.defaultProps = {
  deleteSwipe: 0.33,
  item: null,
  onDelete: null,
};

SwipeToDelete.propTypes = {
  children: PropTypes.node.isRequired,
  deleteSwipe: PropTypes.number,
  item: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf([null])]),
  onDelete: PropTypes.func,
};

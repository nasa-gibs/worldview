import {
  useState, useRef, useEffect, useCallback,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Alerts from './alerts';

export default function AlertDropdown(isTourActive) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  const updateNotifications = useCallback(() => {
    setNotifications(containerRef.current?.children.length || 0);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    updateNotifications();
    observerRef.current = new MutationObserver(updateNotifications);
    observerRef.current.observe(node, { childList: true });
    return () => observerRef.current?.disconnect();
  }, []);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  return (
    <div className="wv-alert-dropdown">
      <button type="button" hidden={notifications <= 1} onClick={toggle}>
        <FontAwesomeIcon
          icon="exclamation-triangle"
          className="wv-alert-icon"
          size="1x"
          widthAuto
        />
        Multiple Layer Alerts
        {dropdownOpen ? <FontAwesomeIcon icon="fa-solid fa-caret-down" widthAuto /> : <FontAwesomeIcon icon="fa-solid fa-caret-up" widthAuto />}
      </button>
      <div ref={containerRef} hidden={!(dropdownOpen || notifications === 1)} id="wv-alert-container" className="wv-alert-container">
        <Alerts />
      </div>
      <div className="wv-alert-footer" hidden={!dropdownOpen || notifications <= 1}>
        <em>Select an issue above for details</em>
      </div>
    </div>
  );
}

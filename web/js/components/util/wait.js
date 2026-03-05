import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Button from './button';

/*
 * @class Wait
 * @extends React.Component
 */
export default function Wait(props) {
  const {
    complete, statusText, onCancel,
  } = props;

  const root = document.querySelector('.wv-content') || document.body;

  return createPortal(
    <div className="wv-wait-progress-overlay">
      <dialog className="wv-wait-progress-dialog" open>
        <div className="wv-wait-progress">
          <div className="wv-wait-progress-message">
            <span>{statusText}</span>
          </div>
          <div className="wv-wait-progress-actions">
            {!complete && (
              <Button
                autoFocus
                text="Cancel"
                onClick={onCancel}
                className="wv-button gray"
                id="wv-wait-cancel-button"
              />
            )}
          </div>
        </div>
      </dialog>
    </div>,
    root
  );
}

Wait.defaultProps = {
  complete: false,
  statusText: '',
  onCancel: null,
};
Wait.propTypes = {
  complete: PropTypes.bool,
  statusText: PropTypes.string,
  onCancel: PropTypes.func,
};

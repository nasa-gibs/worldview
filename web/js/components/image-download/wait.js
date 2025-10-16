import React from 'react';
import { createPortal } from 'react-dom';
import Button from '../util/button';

import '../../../css/components/image-download/snapshot-progress.css';

const Wait = (props) => {
  const { complete = false, statusText, onCancel } = props;

  const root = document.querySelector('.wv-content') || document.body;

  return createPortal(
    <div className="wv-snapshot-progress-overlay">
      <dialog className="wv-snapshot-progress-dialog" open>
        <div className="wv-snapshot-progress">
          <div className="wv-snapshot-progress-message">
            <span>{statusText}</span>
          </div>
          <div className="wv-snapshot-progress-actions">
            {!complete && (
              <Button
                autoFocus
                text="Cancel"
                onClick={onCancel}
                className="wv-button gray"
                id="wv-snapshot-cancel-button"
              />
            )}
          </div>
        </div>
      </dialog>
    </div>,
    root,
  );
};

export default Wait;

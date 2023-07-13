import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';

function ModalComplete(props) {
  const {
    currentStory, modalComplete, resetTour, endTour,
  } = props;
  const { readMoreLinks } = currentStory;
  const closeBtn = (
    <button className="tour-close-btn" onClick={endTour} type="button">
      &times;
    </button>
  );
  let list;
  if (
    readMoreLinks
      && (Array.isArray(readMoreLinks) && readMoreLinks.length)
  ) {
    list = (
      <>
        <p>Read more about this story at the links below:</p>
        <ul>
          {readMoreLinks.map((linkId, i) => (
            /* eslint react/no-array-index-key: 1 */
            <li key={i} index={i}>
              <a href={linkId.link} target="_blank" rel="noopener noreferrer">
                {linkId.title}
              </a>
            </li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <div>
      <Modal
        isOpen={modalComplete}
        toggle={endTour}
        wrapClassName="tour tour-complete"
        backdrop="static"
        fade={false}
        keyboard
      >
        <ModalHeader close={closeBtn}>
          Story Complete
        </ModalHeader>
        <ModalBody>
          <p>
            You have now completed a story in @NAME@. To view more stories,
            click the &ldquo;More Stories&rdquo; button below to explore more events
            within the app. Click the &ldquo;Exit Tutorial&rdquo; button or close this
            window to start using @NAME@ on your own.
          </p>
          {list}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="btn btn-primary"
            onClick={resetTour}
          >
            More Stories
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={endTour}
          >
            Exit Tutorial
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

ModalComplete.propTypes = {
  currentStory: PropTypes.object.isRequired,
  endTour: PropTypes.func.isRequired,
  modalComplete: PropTypes.bool.isRequired,
  resetTour: PropTypes.func.isRequired,
};

export default ModalComplete;

import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ImageDownloadWarning(props) {
  const { type, message } = props;
  const iconClass = `wv-alert-icon image-download-${type}-icon`;
  return (
    <p className="wv-snapshot-warning">
      <span className="wv-snapshot-warning-icon" data-testid={`image-download-${type}-container`}>
        <FontAwesomeIcon
          icon="exclamation-triangle"
          className={iconClass}
          size="1x"
          widthAuto
        />
      </span>
      {message}
    </p>
  );
}

ImageDownloadWarning.propTypes = {
  type: PropTypes.string,
  message: PropTypes.string,
};

export default ImageDownloadWarning;

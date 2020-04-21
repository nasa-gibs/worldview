import PropTypes from 'prop-types';

/*
 * @class Debug
 */
export default function Debug ({ parameters }) {
  if (parameters.showError) {
    throw new Error('this is a test error');
  }
  return '';
}

Debug.propTypes = {
  parameters: PropTypes.object,
};

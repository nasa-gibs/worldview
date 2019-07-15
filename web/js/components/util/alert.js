import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';
import { Portal } from 'react-portal';
/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class OpacitySlider
 * @extends React.Component
 */
export default class AlertComponent extends React.Component {
  constructor(props) {
    super(props);
    if (props.timeout && props.onDismiss) {
      this.timeout = setTimeout(() => {
        props.onDismiss();
      }, props.timeout);
    }
  }
  componentDidMount() {
    this.mounted = true;
  }
  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
  render() {
    return (
      <Portal node={document && document.getElementById('wv-content')}>
        <Alert className="wv-alert" isOpen={this.props.isOpen}>
          <div
            className="alert-content"
            title={this.props.title}
            onClick={this.props.onClick}
          >
            <span>
              {this.props.iconClassName ? (
                <i className={this.props.iconClassName} />
              ) : (
                ''
              )}
              {this.props.message}
              {this.props.onClick ? (
                <span>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Read More...
                </span>
              ) : null}
            </span>
          </div>
          <div className="close-alert" onClick={this.props.onDismiss}>
            <i className="fa fa-times exit fa-1x" />
          </div>
        </Alert>
      </Portal>
    );
  }
}
AlertComponent.defaultProps = {
  iconClassName: 'fas fa-exclamation-triangle fa-1x',
  title: ''
};
AlertComponent.propTypes = {
  iconClassName: PropTypes.string,
  isOpen: PropTypes.bool,
  message: PropTypes.string,
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
  timeout: PropTypes.number,
  title: PropTypes.string
};

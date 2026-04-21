// Taken from https://stackoverflow.com/a/42234988
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Component that alerts if you click outside of it
 */
export default class OutsideAlerter extends Component {
  constructor(props) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('touchstart', this.handleClickOutside);
    document.addEventListener('mousedown', this.handleClickOutside);
    // temp work-around for closing modal with latest version of reactstrap/bootstrap
    const mapElement = document.getElementById('wv-map');
    if (mapElement) {
      mapElement.addEventListener('mousedown', this.handleClickOutside);
    }
  }

  componentWillUnmount() {
    document.addEventListener('touchstart', this.handleClickOutside);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  /**
   * Set the wrapper ref
   */
  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  /**
   * Alert if clicked on outside of element
   */
  handleClickOutside(event) {
    const { onClick, disabled } = this.props;
    if (
      this.wrapperRef
      && !this.wrapperRef.contains(event.target)
      && !disabled
    ) {
      onClick();
    }
  }

  render() {
    const { children } = this.props;
    return <div ref={this.setWrapperRef}>{children}</div>;
  }
}
OutsideAlerter.defaultProps = {
  disabled: false,
};
OutsideAlerter.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

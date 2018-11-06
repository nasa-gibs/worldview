import React from 'react';
import PropTypes from 'prop-types';
import ScrollBar from 'simplebar';
export default class SimpleBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      needsScrollBar: false
    };
  }
  componentDidMount() {
    const element = this.caseEl;
    this.scrollBar = new ScrollBar(element);
    this.content = this.scrollBar.getScrollElement();
  }
  componentDidUpdate() {
    this.updateBoolean();
  }
  /**
   * Use offsetHeight to determine if scrollbar should be visible
   * https://stackoverflow.com/a/42026562/4589331
   */
  updateBoolean() {
    const element = this.content;
    const hasOverflowingChildren = element.offsetHeight + 1 < element.scrollHeight;
    if (this.state.needsScrollBar !== hasOverflowingChildren) {
      this.setState({ needsScrollBar: hasOverflowingChildren });
    }
  }
  render() {
    return (
      <div
        style={this.props.style}
        ref={el => {
          this.caseEl = el;
        }}
        className={
          this.state.needsScrollBar ? 'scrollbar-visible' : 'scrollbar-hidden'
        }
      >
        {this.props.children}
      </div>
    );
  }
}

SimpleBar.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object
};

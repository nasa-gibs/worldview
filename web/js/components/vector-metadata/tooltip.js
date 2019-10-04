import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

export default class VectorMetaTooltip extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      tooltipOpen: false
    };
  }

  toggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  render() {
    console.log(this.props)
    return (
      <Fragment key={this.props.index}>
        <span href="#" id={'tooltip-' + this.props.index}><i className="fa fa-info vector-info-icon"></i></span>
        <Tooltip
          dangerouslySetInnerHTML={{ __html: this.props.description }}
          boundariesElement="window"
          placement="top"
          isOpen={this.state.tooltipOpen}
          target={'tooltip-' + this.props.index}
          toggle={this.toggle}
          fade={false}
        >
        </Tooltip>
      </Fragment>
    );
  }
}

VectorMetaTooltip.propTypes = {
  index: PropTypes.number.isRequired,
  description: PropTypes.string
};

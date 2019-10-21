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
    const { id, index, description } = this.props;
    const elId = 'tooltip-' + id + '-' + this.props.index;
    return (
      <Fragment key={id + index}>
        <span href="#" id={elId}><i className="fa fa-info vector-info-icon"></i></span>
        <Tooltip
          dangerouslySetInnerHTML={{ __html: description }}
          boundariesElement="window"
          placement="top"
          isOpen={this.state.tooltipOpen}
          target={elId}
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

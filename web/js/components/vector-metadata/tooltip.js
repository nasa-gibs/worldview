import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import util from '../../util/util';

export default class VectorMetaTooltip extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.state = {
      tooltipOpen: false
    };
  }

  toggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  mouseEnter() {
    this.setState({
      tooltipOpen: true
    });
  }

  mouseLeave() {
    this.setState({
      tooltipOpen: false
    });
  }

  render() {
    const { id, index, description } = this.props;
    const elId = util.cleanId(String('tooltip' + id + index));

    return (
      <div className='vector-info-tooltip-case' onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave} key={elId}>
        <div id={elId} className='sub-case' ><i className="fa fa-info vector-info-icon cursor-pointer"></i></div>
        <Tooltip
          dangerouslySetInnerHTML={{ __html: description }}
          boundariesElement="window"
          placement="right"
          isOpen={this.state.tooltipOpen}
          target={elId}
          fade={false}
        >
        </Tooltip>
      </div>
    );
  }
}

VectorMetaTooltip.propTypes = {
  index: PropTypes.number.isRequired,
  description: PropTypes.string
};

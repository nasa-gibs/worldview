import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import util from '../../util/util';

export default class VectorMetaTooltip extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.state = {
      tooltipOpen: false,
    };
  }

  toggle() {
    this.setState((prevState) => ({
      tooltipOpen: !prevState.tooltipOpen,
    }));
  }

  mouseEnter() {
    this.setState({
      tooltipOpen: true,
    });
  }

  mouseLeave() {
    this.setState({
      tooltipOpen: false,
    });
  }

  render() {
    const { id, index, description } = this.props;
    const elId = util.cleanId(String(`tooltip${id}${index}`));
    const { tooltipOpen } = this.state;

    return (
      <div
        className="vector-info-tooltip-case"
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
        key={elId}
      >
        <div id={elId} className="sub-case">
          <FontAwesomeIcon icon={faInfo} className="vector-info-icon cursor-pointer" />
        </div>
        <Tooltip
          dangerouslySetInnerHTML={{ __html: description }}
          boundariesElement="window"
          placement="right"
          isOpen={tooltipOpen}
          target={elId}
          fade={false}
        />
      </div>
    );
  }
}

VectorMetaTooltip.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  description: PropTypes.string,
};

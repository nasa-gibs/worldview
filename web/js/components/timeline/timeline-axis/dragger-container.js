import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Dragger from './timeline-dragger';

/*
 * Dragger container used to conditionally render based on selected dragger
 * this is necessary for svg dragger z-index (ex: allow B to drag over A if B being dragged)
 *
 * @class Dragger
 * @extends PureComponent
 */
class DraggerContainer extends PureComponent {
  render() {
    let {
      draggerSelected,
      toggleShowDraggerTime,
      transformX,
      handleDragDragger,
      selectDragger,
      compareModeActive,
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB
    } = this.props;

    let sharedProps = {
      toggleShowDraggerTime,
      transformX,
      handleDragDragger,
      selectDragger,
      compareModeActive
    };

    return (
      draggerSelected === 'selectedB'
        ? <React.Fragment>
          <Dragger
            {...sharedProps}
            disabled={true}
            draggerName='selected'
            draggerPosition={draggerPosition}
            draggerVisible={draggerVisible}
          />
          <Dragger
            {...sharedProps}
            disabled={false}
            draggerName='selectedB'
            draggerPosition={draggerPositionB}
            draggerVisible={draggerVisibleB}
          />
        </React.Fragment>
        : <React.Fragment>
          <Dragger
            {...sharedProps}
            disabled={true}
            draggerName='selectedB'
            draggerPosition={draggerPositionB}
            draggerVisible={draggerVisibleB}
          />
          <Dragger
            {...sharedProps}
            disabled={false}
            draggerName='selected'
            draggerPosition={draggerPosition}
            draggerVisible={draggerVisible}
          />
        </React.Fragment>
    );
  }
}

DraggerContainer.propTypes = {
  compareModeActive: PropTypes.bool,
  disabled: PropTypes.bool,
  draggerName: PropTypes.string,
  draggerPosition: PropTypes.number,
  draggerVisible: PropTypes.bool,
  handleDragDragger: PropTypes.func,
  selectDragger: PropTypes.func,
  toggleShowDraggerTime: PropTypes.func,
  transformX: PropTypes.number
};

export default DraggerContainer;

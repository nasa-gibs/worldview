import React from 'react';
import lodashIsEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';

export const SidebarContext = React.createContext();
export class SidebarProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      updateLayer: props.updateLayer,
      checkerBoardPattern: props.checkerBoardPattern,
      getAvailability: props.getAvailability,
      getNames: props.getNames,
      palettePromise: props.palettePromise,
      runningLayers: props.runningLayers,
      getLegend: props.getLegend,
      zotsObject: props.zotsObject,
      replaceSubGroup: props.replaceSubGroup,
      isMobile: props.isMobile
    };
  }
  componentWillReceiveProps(props, prevProps) {
    if (prevProps.runningLayers !== props.runningLayers) {
      this.setState({ runningLayers: props.runningLayers });
    }
    if (!lodashIsEqual(prevProps.zotsObject, props.zotsObject)) {
      this.setState({ zotsObject: props.zotsObject });
    }
  }
  render() {
    return (
      <SidebarContext.Provider value={this.state}>
        {this.props.children};
      </SidebarContext.Provider>
    );
  }
}
SidebarProvider.propTypes = {
  children: PropTypes.array,
  isMobile: PropTypes.bool,
  replaceSubGroup: PropTypes.func,
  updateLayer: PropTypes.func,
  checkerBoardPattern: PropTypes.object,
  getAvailability: PropTypes.func,
  getNames: PropTypes.func,
  palettePromise: PropTypes.func,
  runningLayers: PropTypes.object,
  getLegend: PropTypes.func,
  zotsObject: PropTypes.object
};

import React from 'react';
import lodashIsEqual from 'lodash/isEqual';
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

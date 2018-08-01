import React from 'react';
import PropTypes from 'prop-types';
import Tab from './tab';

class Tabs extends React.Component {
  render() {
    const { activeTab, tabTypes, onTabClick } = this.props;
    return (
      <ul id="productsHolder-tabs">
        <Tab
          listClasses="layerPicker first"
          tabName="Layers"
          isActive={activeTab === 'layers'}
          iconClasses="productsIcon selected icon-layers"
          tabExists={tabTypes.layers}
          onclick={onTabClick}
        />
        <Tab
          listClasses="layerPicker second eventPicker"
          tabName="Events"
          isActive={activeTab === 'events'}
          iconClasses="productsIcon selected icon-events"
          tabExists={tabTypes.events}
          onclick={onTabClick}
        />
        <Tab
          listClasses="layerPicker dataPicker"
          tabName="Data"
          isActive={activeTab === 'download'}
          iconClasses="productsIcon selected icon-download"
          tabExists={tabTypes.download}
          onclick={onTabClick}
        />
      </ul>
    );
  }
}

Tabs.propTypes = {
  activeTab: PropTypes.string,
  tabTypes: PropTypes.object,
  onTabClick: PropTypes.func
};
export default Tabs;

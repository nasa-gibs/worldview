import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ModalBody, ModalHeader, Nav, NavItem, NavLink } from 'reactstrap';
import Scrollbars from '../components/util/scrollbar';
import VectorMetaTable from '../components/vector-metadata/table';

class VectorDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeIndex: 0 };
    this.updateIndex = this.updateIndex.bind(this);
  }

  updateIndex(activeIndex) {
    if (activeIndex === this.state.activeIndex) return;
    this.setState({ activeIndex });
  }

  render() {
    const { toggleWithClose, vectorMetaObject, modalHeight, dialogKey } = this.props;
    const { activeIndex } = this.state;
    const navArray = [];
    const keyArray = [];
    let i = 0;
    for (const [key, value] of Object.entries(vectorMetaObject)) {
      const stringLength = 20;
      const title = (value[0].title || key);
      const titleText = title.length > stringLength ? title.substring(0, stringLength) + '...' : title;
      const index = i;
      keyArray.push(key);
      navArray.push(
        <NavItem
          key={key}
          className="vector-meta-nav-item"
          active={activeIndex === i}
        >
          <NavLink onClick={() => this.updateIndex(index)} title={title}>
            {titleText + ' [' + (value.length) + ']'}
          </NavLink>
        </NavItem>
      );
      i++;
    }
    const activeMetaArray = vectorMetaObject[keyArray[activeIndex]];

    return (
      <div className='draggable-modal-content' >
        <ModalHeader toggle={toggleWithClose}>
          <Nav tabs id="vector-meta-nav" className="vector-meta-nav">
            {navArray}
          </Nav>
        </ ModalHeader>

        <ModalBody>
          <Scrollbars style={{ maxHeight: modalHeight - 70 + 'px' }} >
            <VectorMetaTable id={dialogKey} metaArray={activeMetaArray} title={keyArray[activeIndex]} />
          </ Scrollbars>
        </ModalBody>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {};
};
export default connect(
  mapStateToProps,
  null
)(VectorDialog);
VectorDialog.propTypes = {
  dialogKey: PropTypes.string,
  modalHeight: PropTypes.number,
  toggleWithClose: PropTypes.func,
  vectorMetaArray: PropTypes.array,
  vectorMetaObject: PropTypes.object
};

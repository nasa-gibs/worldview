import React from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import { toggleCustomContent } from '../../../modules/modal/actions';
import DevTestModal from './dev-test-modal';

function DevTestButton () {
  const dispatch = useDispatch();
  const openTestMenu = () => {
    const key = 'DEV_TEST_MENU';
    const title = 'Dev Test Menu';
    dispatch(
      toggleCustomContent(key, {
        headerText: title,
        backdrop: false,
        bodyComponent: DevTestModal,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'sidebar-modal layer-settings-modal',
        timeout: 150,
        size: 'lg',
        bodyComponentProps: {
        },
      }),
    );
  };

  return (
    <div id="dev-block" className="d-flex justify-content-center">
      <Button
        onClick={openTestMenu}
        color="primary"
        style={{ zIndex: '999' }}
      >
        Open Test Menu
      </Button>
    </div>
  );
}

export default DevTestButton;

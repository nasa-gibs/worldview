import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearErrorTiles as clearErrorTilesAction } from '../../../modules/ui/actions';

function TileErrorsHandler({ tileErrorAction }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };

  const { isKioskModeActive, errorTiles } = useSelector((state) => ({
    isKioskModeActive: state.ui.isKioskModeActive,
    errorTiles: state.ui.errorTiles,
  }));

  useEffect(() => {
    if (isKioskModeActive && errorTiles.length) {
      handleErrorTiles();
    }
  }, [tileErrorAction]);


  const handleErrorTiles = () => {
    console.log('I need to handle some tile errors', errorTiles);
    clearErrorTiles();
  };

  return null;
}

export default TileErrorsHandler;

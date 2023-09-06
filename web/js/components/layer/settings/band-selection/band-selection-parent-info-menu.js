import React from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import BandSelectionMenu from './band-selection-menu';
import { toggleCustomContent } from '../../../../modules/modal/actions';

export default function BandSelectionParentInfoMenu({ layer }) {
  const dispatch = useDispatch();
  const onCustomizeBandClick = (layer) => {
    const key = `BAND_SELECTION_MODAL_${layer.id}`;
    const title = `Customize Bands for the ${layer.title} layer`;
    dispatch(
      toggleCustomContent(key, {
        headerText: title,
        backdrop: false,
        bodyComponent: BandSelectionMenu,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'sidebar-modal layer-settings-modal',
        timeout: 150,
        size: 'lg',
        bodyComponentProps: {
          layer,
        },
      }),
    );
  };

  const {
    r,
    g,
    b,
    expression,
  } = layer.bandCombo;

  const isValidBandSelection = () => (r !== 'undefined' && r !== undefined) && (g !== 'undefined' && g !== undefined) && (b !== 'undefined' && b !== undefined);


  return (
    <div className="customize-bands-parent-info">
      <hr />
      <p>Channels and bands assigned:</p>
      {
        isValidBandSelection()
          ? (
            <div className="current-band-info">
              <div>
                <span className="band-color">Red:</span>
                <span className="band-name">
                  Band
                  {' '}
                  {r}
                </span>
              </div>
              <div>
                <span className="band-color">Green:</span>
                <span className="band-name">
                  Band
                  {' '}
                  {g}
                </span>
              </div>
              <div>
                <span className="band-color">Blue:</span>
                <span className="band-name">
                  Band
                  {' '}
                  {b}
                </span>
              </div>
            </div>
          )
          : (
            <div className="current-band-info">
              <div>
                <span className="band-color">Expression:</span>
                <span className="band-name">
                  {expression}
                </span>
              </div>
            </div>
          )
      }
      <div className="customize-bands-button-container">
        <Button
          id="customize-bands-button"
          aria-label="Customize band selection"
          className="wv-button red"
          onClick={() => onCustomizeBandClick(layer)}
        >
          <span className="button-text">
            Customize
          </span>
        </Button>
      </div>
      <hr />
    </div>
  );
}

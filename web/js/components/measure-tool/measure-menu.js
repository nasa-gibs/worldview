import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Form } from 'reactstrap';

import { onToggle } from '../../modules/modal/actions';
import { changeUnits } from '../../modules/measure/actions';
import IconList from '../util/icon-list';
import util from '../../util/util';

const { events } = util;

const DOWNLOAD_GEOJSON = {
  text: 'Download as GeoJSON',
  iconClass: 'ui-icon icon-large',
  iconName: 'download',
  id: 'download-geojson-button',
  key: 'measure:download-geojson',
  className: 'measure-download',
};

const OPTIONS_ARRAY = [
  {
    text: 'Measure distance',
    iconClass: 'ui-icon icon-large',
    iconName: 'ruler',
    id: 'measure-distance-button',
    key: 'measure:distance',
  },
  {
    text: 'Measure area',
    iconClass: 'ui-icon icon-large',
    iconName: 'ruler-combined',
    id: 'measure-area-button',
    key: 'measure:area',
  },
  {
    text: 'Remove Measurements',
    iconClass: 'ui-icon icon-large',
    iconName: 'trash',
    id: 'clear-measurements-button',
    key: 'measure:clear',
    hidden: true,
  },
  DOWNLOAD_GEOJSON,
];

const MeasureMenu = function () {
  const dispatch = useDispatch();

  const {
    isMobile, isTouchDevice, unitOfMeasure, measurementsInProj,
  } = useSelector((state) => ({
    isMobile: state.screenSize.isMobileDevice,
    isTouchDevice: state.modal.customProps.touchDevice,
    unitOfMeasure: state.measure.unitOfMeasure,
    measurementsInProj: !!Object.keys(state.measure.allMeasurements[state.proj.selected.crs]).length,
  }), shallowEqual);

  const triggerEvent = (eventName) => {
    events.trigger(eventName);
    dispatch(onToggle());
  };

  const unitToggle = (evt) => {
    const { checked } = evt.target;
    const units = checked ? 'mi' : 'km';
    dispatch(changeUnits(units));
  };

  const listSize = isTouchDevice ? 'large' : 'small';
  DOWNLOAD_GEOJSON.hidden = !measurementsInProj || isMobile;
  const getRemoveOptionIndex = OPTIONS_ARRAY.findIndex((item) => item.text === 'Remove Measurements');
  OPTIONS_ARRAY[getRemoveOptionIndex].hidden = !measurementsInProj;

  return (
    <>
      <Form>
        <div className="measure-unit-toggle custom-control custom-switch">
          <input
            id="unit-toggle"
            className="custom-control-input"
            type="checkbox"
            onChange={unitToggle}
            defaultChecked={unitOfMeasure === 'mi'}
          />
          <label className="custom-control-label" htmlFor="unit-toggle">
            {unitOfMeasure}
          </label>
        </div>
      </Form>
      <IconList
        list={OPTIONS_ARRAY}
        onClick={triggerEvent}
        size={listSize}
      />
    </>
  );
};

export default MeasureMenu;

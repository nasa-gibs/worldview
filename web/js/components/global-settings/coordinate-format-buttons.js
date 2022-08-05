import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverTooltip from '../util/hover-tooltip';
import { COORDINATE_FORMATS } from '../../modules/settings/constants';
import util from '../../util/util';

const { events } = util;

function CoordinateFormatButtons ({ changeCoordinateFormat, coordinateFormat }) { 

    //trigger event to update coordinates dialog when coordinateFormat state changes
    //coordinates dialog cannot communicate with Redux right now
    useEffect(() => {
        events.trigger('location-search:ol-coordinate-format');
    }, [coordinateFormat])

    return (
        <div className="settings-component">
            <h3 className="wv-header">
                Coordinate Format
                {' '}
                <span><FontAwesomeIcon id="coordinate-format-buttons-info-icon" icon="info-circle" /></span>
                <HoverTooltip 
                isMobile={false}
                labelText="Applied to all on screen coordinates"
                target="coordinate-format-buttons-info-icon"
                placement="right"
                />
            </h3>
            <ButtonGroup>
                {COORDINATE_FORMATS.map((format) => (
                    <Button
                    key={`${format}-button`}
                    aria-label={`Set ${format} Format`}
                    outline
                    className="setting-button"
                    active={coordinateFormat === format}
                    onClick={() => changeCoordinateFormat(format)}
                    >
                        {format}
                    </Button>
                ))}
            </ButtonGroup>
        </div>
    )
};

CoordinateFormatButtons.propTypoes = {
    changeCoordinateFormat: PropTypes.func,
    coordinateFormat: PropTypes.string,
};

export default CoordinateFormatButtons
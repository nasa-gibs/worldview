/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
var wv = wv || {};

wv.share = wv.share || {};

wv.share = wv.share || function() {
    var self = {};
    self.init = function() {
        //mount react component
        self.reactComponent = ReactDOM.render(<App />, $('#wv-link-button')[0]);
    };

    self.init();
    return self;
};

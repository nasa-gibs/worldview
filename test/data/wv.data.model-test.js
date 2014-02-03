/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

buster.testCase("wv.data.model", {

    config: null,
    models: null,
    model: null,

    setUp: function() {
        this.config = {
            products: {
                "product1": {}
            }
        };
        this.models = {};
        this.models.proj = wv.proj.model(this.config);
        this.models.proj.selected = {
            id: "geographic"
        };
        this.models.date = wv.date.model();
        this.models.layers = wv.layers.model(this.models, this.config);
        this.model = wv.data.model(this.models, this.config);
    },

    "No permalink when not active": function() {
        buster.refute(this.model.toPermalink());
    },

    "To permalink": function() {
        this.model.active = true;
        this.model.selectedProduct = "product1";
        buster.assert.equals(this.model.toPermalink(),
                "dataDownload=product1");
    },

    "Subscribed for startup event when data download in permalink": function() {
        this.models.wv = {
            events: {
                on: this.stub()
            }
        };
        this.model.fromPermalink("dataDownload=product1");
        buster.assert.calledWith(this.models.wv.events.on, "startup");
    }

});


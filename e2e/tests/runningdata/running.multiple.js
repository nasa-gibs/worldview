module.exports = {
    'Running Data: Testing multiple layers at same time' : function (browser) {
    	var height, width;
        browser
            .url(browser.globals.url + '?p=geographic&l=MODIS_Terra_Aerosol,MODIS_Terra_Brightness_Temp_Band31_Day&t=2017-03-22&z=3&v=136.07019188386334,14.722152527011556,155.59817576644127,24.312819167567586')
            .pause(500);

        browser.getElementSize("#wv-map-geographic .ol-viewport", function(result) {

        	width = result.value.width;
        	height = result.value.height;
        
	        browser
	            .useCss()
	            .moveToElement('.ol-viewport',  width - (width / 2)  ,  height - (height / 2)) // clicking the very middle point of page
	            .mouseButtonDown(0)
	            .pause(1000);
			browser.getText('#overlays-MODIS_Terra_Aerosol .wv-running-label', function(result){
				this.assert.equal(result.value, '0.070 – 0.075');
			});
			browser.getText('#overlays-MODIS_Terra_Brightness_Temp_Band31_Day .wv-running-label', function(result){
				this.assert.equal(result.value, '291.9 K');
			});
		});
		browser.end();
    }
};
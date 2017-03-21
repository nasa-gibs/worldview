module.exports = {
    'Running Data for normal continuous layer' : function (browser) {
    	var height, width;
        browser
            .url(browser.globals.url + '?p=geographic&l=MODIS_Terra_Brightness_Temp_Band31_Day,Coastlines(hidden)&t=2015-05-25&z=2&v=-42.148380855752734,42.13121723408824,22.122734950093943,85.16225953076464')
            .pause(500)
            .resizeWindow(800, 600);

        browser.getElementSize("#wv-map-geographic .ol-viewport", function(result) {

        	width = result.value.width;
        	height = result.value.height;
        
	        browser
	            .useCss()
	            .moveToElement('.ol-viewport',  width - (width / 2)  ,  height - (height / 2))
	            .mouseButtonDown(0)
	            .pause(10);
			browser.getText('.wv-running-label', function(result){
				this.assert.equal(result.value, '271.1 K');
			});
			browser.getElementSize(".wv-palette .wv-palettes-colorbar", function(result) {
	        	width = result.value.width;
	        	height = result.value.height;
				browser
		            .useCss()
		            .moveToElement('.wv-palette .wv-palettes-colorbar',  width - (width / 2)  ,  height - (height / 2));
				browser.getText('.wv-running-label', function(result){
		        	this.assert.equal(result.value, '260.9 K');
		        });
		    });

		});
		browser.end();
    }
};
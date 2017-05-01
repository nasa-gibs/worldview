var wv = wv || {};                                                                                                                      
wv.notifications = wv.notifications || {};                                                                                                                    
    
/*  
 * @Class
 */ 
wv.notifications.model = wv.notifications.model || function(models) {
	self.infoIconActive = false;
	self.messageIconActive = false;
	self.notifyIconActive = false;

	self.events = wv.util.events();

	var init = function() {
		self.events.on('');
	};

};
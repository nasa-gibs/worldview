var rb;

function showSelector(e){
	
	//console.log("show selector");
	var selector = e.data.selector;
	selector.show();
	var myid = "selector_c";
	
	// force center
	selector.center();
	var viewWidth = $(window).width();
	var selWidth = parseInt(YAHOO.util.Dom.getStyle(myid, 'width'), 10);
	var newX = (viewWidth - selWidth)/2;
	YAHOO.util.Dom.setX(myid, newX);
	//console.log("selWidth = " + selWidth);
	//console.log("newX = " + newX);
	
	// get screen width
	var devWidth = window.screen.availWidth;

	if(devWidth >= 1260 && viewWidth >= 1260) {
	
		// move if tour window is showing
		var classList = document.getElementsByClassName('joyride-tip-guide bordered');
		if(classList.length > 2) {
			if((classList[0].style.display === "block") || (classList[1].style.display === "block")){
	   			var tourWidth = $(".joyride-tip-guide").width();
				var pos = YAHOO.util.Dom.getX(myid);
				var newX = parseInt(pos, 10) + tourWidth - 20;
				YAHOO.util.Dom.setX(myid, newX);
			}
		}
	}
}

/**
 * Before closing the selector, move the product picker back to its
 * original place if it's showing.
 *//*
function closeSelector(e){
	
	//console.log("close selector");
	var selector = e.data.selector;
	
	// force center
	selector.center();
	var viewWidth = $(window).width();
	var selWidth = parseInt(YAHOO.util.Dom.getStyle(myid, 'width'), 10);
	var newX = (viewWidth - selWidth)/2;
	YAHOO.util.Dom.setX(myid, newX);
	//console.log("selWidth = " + selWidth);
	//console.log("newX = " + 0);
}*/


function showRubberBand(){
	rb.draw("map");
	
}

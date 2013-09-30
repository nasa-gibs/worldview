SOTE.namespace("SOTE.widget.Bank");

SOTE.widget.Bank.prototype = new SOTE.widget.Component;

/**
  * Instantiate the Bank
  *
  * @class A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories.
  * @constructor
  * @this {Bank}
  * @param {String} containerId is the container id of the div in which to render the object
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  *
*/
SOTE.widget.Bank = function(containerId, config){
    this.log = Logging.getLogger("Worldview.Widget.Bank");
    this.VALID_PROJECTIONS = ["geographic", "arctic", "antarctic"];
    this.hidden = {};

    //Get the ID of the container element
    this.container=document.getElementById(containerId);
    if (this.container==null){
        this.setStatus("Error: element '"+containerId+"' not found!",true);
        return;
    }
    this.id = containerId;
    //Store the container's ID
    this.containerId=containerId;

    //Define an object for holding configuration
    if (config===undefined){
        config={};
    }

    if(config.title === undefined){
        config.title = "My Bank";
    }

    if(config.categories === undefined){
        config.categories = ["Category 1","Category 2"];
    }

    if(config.callback === undefined){
        config.callback = null;
    }

    if(config.state === undefined || config.state === ""){
        config.state = "geographic";
    }


    this.state = config.state;
    //console.log("state: " + this.state);
    this.selected = config.selected;
    this.values = this.unserialize(this.selected[this.state]);

    this.dataSourceUrl = config.dataSourceUrl;
    //console.log("dataSourceUrl: " + this.dataSourceUrl);
    this.title = config.title;
    this.callback = config.callback;
    this.selector = config.selector;
    this.meta = new Object;
    this.buildMetaDone = false;
    /*this.meta["MODIS_Terra_CorrectedReflectance_TrueColor"] = {label:"Corrected Reflectance (True Color)",sublabel:"Terra / MODIS"};
    this.meta["fires48"] = {label:"Fires (Past 48 Hours)",sublabel:"MODIS Fire and Thermal Anomalies"};
    this.meta["AIRS_Dust_Score"] = {label:"Dust Score",sublabel:"Aqua / AIRS"};
    this.meta["OMI_Aerosol_Index"] = {label:"Aerosol Index",sublabel:"Aura / OMI"};*/
    this.categories = config.categories;
    this.initRenderComplete = false;
    this.dataSourceUrl = config.dataSourceUrl;
    this.statusStr = "";
    this.config = config.config;
    this.paletteWidget = config.paletteWidget;
    this.queryString = "";
    this.noFireVal = null;
    this.init();
    //this.updateComponent(this.id+"=baselayers.MODIS_Terra_CorrectedReflectance_TrueColor-overlays.fires48.AIRS_Dust_Score.OMI_Aerosol_Index")

};

SOTE.widget.Bank.prototype.buildMeta = function(cb,val){
    this.buildMetaDone = false;
    var data = this.config.ap_products[this.state];
    SOTE.widget.Bank.handleMetaSuccess(data, null, null, {
        self: this,
        callback: cb,
        val: val
    });
};

SOTE.widget.Bank.handleMetaSuccess = function(data,status,xhr,args){
    var self = args.self;
    for(var i in data){
        if(i != "palettes") {
            for(var j=0; j<data[i].length; j++){

                self.meta[data[i][j].value] = {label:data[i][j].label,sublabel:data[i][j].sublabel,type:data[i][j].type};

            }
        }
    }

    /* TODO: This breaks when switching to polar projections
    var key = data["Floods"][0].value;
    //console.log("Key = " + key);
    //console.log("Meta Label = " + self.meta[key].label);
    //console.log("Meta Sublabel = " + self.meta[key].sublabel);
    */
    $.each(self.meta, function(name, meta) {
       if ( name in self.config.layers) {
           var layer = self.config.layers[name];
           if ( "rendered" in layer ) {
               meta.units = layer.units;
               meta.min = ( layer.min === undefined )
                       ? "&nbsp;&nbsp;&nbsp;&nbsp"
                       : layer.min;
               meta.max = ( layer.max === undefined )
                       ? "&nbsp;&nbsp;&nbsp;"
                       : layer.max;
               meta.bins = layer.bins;
               meta.stops = layer.stops;
               meta.palette = self.config.palettes[layer.rendered];
           }
       }
    });
    if(args.callback){
        args.callback({self:self,val:args.val});
    }
    else{
        self.values = null;
        self.values = self.unserialize(self.selected[self.state]);
        self.render();
        self.fire();
    }
    self.buildMetaDone = true;
};

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered
  * with controllers to call the events.
  *
  *
  * @this {Bank}
  *
*/
SOTE.widget.Bank.prototype.init = function(){

    this.buildMeta();

    if(REGISTRY){
         REGISTRY.register(this.id,this);
    }
    else{
        alert("No REGISTRY found!  Cannot register Bank!");
    }


};

/**
  * Renders the UI accordion from this.items
  *
  *
  * @this {Bank}
  *
*/
SOTE.widget.Bank.prototype.render = function(){

    this.container.innerHTML = "";

/*    var tabs = document.createElement("ul");
    tabs.innerHTML = "<li><a href='#bank' class='activetab'>Active</a></li><li><a class='addlayerstab' href='#selectorbox'>Add Layers</a></li>";
    this.container.appendChild(tabs);
    */
    var tabs_height = $(".ui-tabs-nav").outerHeight(true);
    $('#'+this.id).addClass('bank');
    $('#'+this.id).height($('#'+this.id).parent().outerHeight() - tabs_height);    /*var container = document.createElement("div");
    container.setAttribute("id","bank");
    container.setAttribute("class","bank");*/

    //var titleContainer = document.createElement("div");
    //titleContainer.setAttribute("class","tabContainer");
    //var title = document.createElement("h2");
    //title.innerHTML = "Active"; //this.title;
    /*var ext = document.createElement("a");
    ext.setAttribute("id","callSelectorLink");
    ext.setAttribute("class","callSelectorLink");
    ext.setAttribute("title","Show Product Listing");
    */
    //titleContainer.appendChild(title);
    //titleContainer.appendChild(ext);

    //container.appendChild(titleContainer);

    //$('#'+this.id).delegate('.callSelectorLink','click',{selector:this.selector},this.callback);

    for(var i=0; i<this.categories.length; i++){
        var formattedCategoryName = this.categories[i].replace(/\s/g, "");
        var category = document.createElement("ul");
        category.setAttribute("id",formattedCategoryName.toLowerCase());
        category.setAttribute("class",this.id+"category category");

        var categoryContainer = document.createElement("div");
        categoryContainer.setAttribute("id",this.id + formattedCategoryName);
        categoryContainer.setAttribute("class","categoryContainer");

        var categoryTitle = document.createElement("h3");
        categoryTitle.setAttribute("class","head");
        categoryTitle.innerHTML = this.categories[i];

        categoryContainer.appendChild(categoryTitle);


        if(this.values !== null && this.values[formattedCategoryName.toLowerCase()]){
            for(var j=0; j<this.values[formattedCategoryName.toLowerCase()].length; j++){
                var myVal = this.values[formattedCategoryName.toLowerCase()][j].value;
                var item = document.createElement("li");
                item.setAttribute("id",formattedCategoryName.toLowerCase()+"-"+myVal);
                item.setAttribute("class",this.id+"item item");
                item.innerHTML = "<a><img class='close bank-item-img' id='close"+myVal.replace(/:/g,"colon")+"' title='Remove Layer' src='images/close-red-x.png' /></a>";
                if(this.meta !== null && this.meta[myVal]){
                    if(myVal in this.hidden){
                        item.innerHTML += "<a class='hdanchor'><img class='hide hideReg bank-item-img' title='Show Layer' id='hide"+myVal.replace(/:/g,"colon")+"' src='images/invisible.png' /></a>";
                    }
                    else {
                        item.innerHTML += "<a class='hdanchor'><img class='hide hideReg bank-item-img' title='Hide Layer' id='hide"+myVal.replace(/:/g,"colon")+"' src='images/visible.png' /></a>";
                    }
                    item.innerHTML += "<h4>"+this.meta[myVal].label+"</h4>";
                    item.innerHTML += "<p>"+this.meta[myVal].sublabel+"</p>";
                    var m = this.meta[myVal];

                    if(m && m.palette){
                        var paletteString = "<div><span class='palette'><span class='p-min' style='margin-right:10px;'>"+m.min+"</span>" +
                             "<canvas class='colorBar' id='canvas"+this.values[formattedCategoryName.toLowerCase()][j].value+"' width=100px height=14px'></canvas>" +
                             "<span class='p-max' style='margin-left:10px;'>"+m.max+"</span>";
                        if(m.units && m.units != ""){
                            paletteString += "<span class='p-units' style='margin-left:3px;'>"+m.units+"</span></span></div>";
                        }
                        item.innerHTML += paletteString;
                    }

                }
                else{
                    item.innerHTML += "<h4>"+this.values[formattedCategoryName.toLowerCase()][j].value+"</h4>";
                }
                category.appendChild(item);
            }
        }

        categoryContainer.appendChild(category);
        this.container.appendChild(categoryContainer);

    }
    /*
    var selectorbox = document.createElement("div");
    selectorbox.setAttribute("id","selectorbox");
    this.container.appendChild(selectorbox);*/

    this.renderCanvases();
    /*var accordionToggler = document.createElement("a");
    accordionToggler.setAttribute("class","accordionToggler atcollapse");
    accordionToggler.setAttribute("title","Hide Products");
    this.isCollapsed = false;
    this.container.appendChild(accordionToggler);
    $('.accordionToggler').bind('click',{self:this},SOTE.widget.Bank.toggle);*/
    $("#"+this.id).undelegate(".close" ,'click');
    $("#"+this.id).undelegate(".hideReg" ,'click');
    $("#"+this.id).undelegate(".hideSingle" ,'click');
    $("#"+this.id).delegate(".close" ,'click',{self:this},SOTE.widget.Bank.removeValue);
    $("#"+this.id).delegate(".hideReg" ,'click',{self:this},SOTE.widget.Bank.toggleValue);
    $("#"+this.id).delegate(".hideSingle" ,'click',{self:this},SOTE.widget.Bank.toggleValue);
    $( "." + this.id + "category" ).sortable({items: "li:not(.head)", axis: "y", containment: "parent"});
    if($(window).width() > 720)
    {
        if(this.jsp){
            var api = this.jsp.data('jsp');
            if(api) api.destroy();
        }
        this.jsp = $( "." + this.id + "category" ).jScrollPane({autoReinitialise: false, verticalGutter:0});
    }
    $( "." + this.id + "category li" ).disableSelection();
    $( "." + this.id + "category" ).bind('sortstop',{self:this},SOTE.widget.Bank.handleSort);

    setTimeout(SOTE.widget.Bank.adjustCategoryHeights,1,{self:this});

    //this.hideAllRadioExceptTop();

    /*$('#'+this.id).tabs();
    //this.b = new SOTE.widget.Bank("products",{paletteWidget: window.palettes, dataSourceUrl:"ap_products.php",title:"My Layers",selected:{antarctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,antarctic_coastlines", arctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,arctic_coastlines",geographic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,sedac_bound"},categories:["Base Layers","Overlays"],config:config});
    this.s = new SOTE.widget.Selector("selectorbox",{dataSourceUrl:"ap_products.php",categories:["Base Layers","Overlays"]});    */

    // Mark the component as ready in the registry if called via init()
    if ((this.initRenderComplete === false) && REGISTRY) {
        this.initRenderComplete = true;
        REGISTRY.markComponentReady(this.id);
    }

};

SOTE.widget.Bank.adjustCategoryHeights = function(args){
    var self = args.self;
    var heights = new Array;
    var container_height = $("#"+self.id).outerHeight(true);
    var labelHeight = 0;
    $('#'+self.id+' .head').each(function(){
        labelHeight += $(this).outerHeight(true);
    });
    container_height -= labelHeight;
    //console.log("This.id: " + container_height);
    for(var i=0; i<self.categories.length; i++){
        var formattedCategoryName = self.categories[i].replace(/\s/g, "");
        var actual_height = 0;
        var count = 0;
        $('#' + formattedCategoryName.toLowerCase() + ' li').each(function(){
            actual_height += $(this).outerHeight(true);
            count++;
        });

        heights.push({name:formattedCategoryName.toLowerCase(),height:actual_height,count:count});
    }

    if(heights[0].height + heights[1].height > container_height){
        if(heights[0].height > container_height/2) {
            heights[0].height = container_height/2;
        }

        heights[1].height = container_height - heights[0].height;

    }

    $("#" + heights[0].name).css("height",heights[0].height+"px");
    $("#" + heights[1].name).css("height",heights[1].height+"px");

    SOTE.widget.Bank.reinitializeScrollbars({self:self});
};

SOTE.widget.Bank.reinitializeScrollbars = function(o) {
    var pane = $("." + o.self.id + "category").each(function(){
        var api = $(this).data('jsp');
        if(api) api.reinitialise();
    });
};

SOTE.widget.Bank.prototype.renderCanvases = function(){

    var openPaletteSelector = function(name) {
        return function() {
            if ( !Worldview.Support.allowCustomPalettes() ) {
                Worldview.Support.showUnsupportedMessage();
            } else {
               self.paletteWidget.displaySelector(name);
            }
        };
    };

    var self = this;

    for(var i=0; i<this.categories.length; i++){
        var formattedCategoryName = this.categories[i].replace(/\s/g, "");
        if(this.values !== null && this.values[formattedCategoryName.toLowerCase()]){
            for(var j=0; j<this.values[formattedCategoryName.toLowerCase()].length; j++){
                var val = this.values[formattedCategoryName.toLowerCase()][j].value;
                var m = this.meta[this.values[formattedCategoryName.toLowerCase()][j].value];
                if(m && m.palette){
                    var width = 100/m.palette.length;
                    var canvas = document.getElementById("canvas"+val);
                    if ( m.palette.stops.length > 1 ) {
                       canvas.onclick = openPaletteSelector(val);
                       canvas.style.cursor = "pointer";
                    }
                    var context = canvas.getContext('2d');
                    var palette = this.paletteWidget.getPalette(this.values[formattedCategoryName.toLowerCase()][j].value);

                    var spec = {
                        selector: "#canvas" + val,
                        bins: m.bins,
                        stops: m.stops,
                        palette: palette
                    };
                    Worldview.Palette.ColorBar(spec);
                }
            }
        }
    }
};

SOTE.widget.Bank.toggle = function(e,ui){
    var self = e.data.self;
    if(self.isCollapsed){
        $('.accordionToggler').removeClass('atexpand').addClass('atcollapse');
        $('.accordionToggler').attr("title","Hide Products");
        $('.bank').css('display','block');
        self.isCollapsed = false;
    }
    else{
        $('.accordionToggler').removeClass('atcollapse').addClass('atexpand');
        $('.accordionToggler').attr("title","Show Products");
        $('.bank').css('display','none');
        self.isCollapsed = true;
    }
};

SOTE.widget.Bank.handleSort = function(e,ui){
    var self = e.data.self;
    self.values = new Object;
    for(var i=0; i<self.categories.length; i++){
        var formatted = self.categories[i].replace(/\s/g, "");
        formatted = formatted.toLowerCase();
        self.values[formatted] = new Array();
        jQuery('li[id|="'+formatted+'"]').each(function() {
            var item = jQuery( this );
            var id = item.attr("id");
            var vals = id.split("-");
            var val = vals.splice(0,1);
            val = vals.join("-");
            self.values[formatted].push({value:val});
        });
    }
    self.fire();

};

SOTE.widget.Bank.removeValue = function(e){
    var self = e.data.self;
    var val = e.target.id.replace(/colon/g,":");
    val = val.replace(/close/g,"");
    for(var i=0; i<self.categories.length; i++){
        var formatted = self.categories[i].replace(/\s/g, "");
        formatted = formatted.toLowerCase();
        for(var j=0; j<self.values[formatted].length; j++){
            if(self.values[formatted][j].value == val){
                self.values[formatted].splice(j,1);
            }
        }
    }
    var formattedVal = "close"+val.replace(/:/g,"colon");
    //self.render();
    $("#"+self.id+" #"+formattedVal).parent().parent().remove();
    self.count--;
    self.fire();
};

SOTE.widget.Bank.toggleValue = function(e){
    var self = e.data.self;
    var val = e.target.id.replace(/colon/g,":");
    val = val.replace(/hide/g,"");
    for(var i=0; i<self.categories.length; i++){
        var formatted = self.categories[i].replace(/\s/g, "");
        formatted = formatted.toLowerCase();
        if(self.values[formatted]){
            for(var j=0; j<self.values[formatted].length; j++){
                if(self.values[formatted][j].value == val){
                    if(val in self.hidden){
                        delete self.hidden[val];
                        e.target.src = 'images/visible.png';
                        $("#"+e.target.id).attr("title","Hide Layer");
                    }
                    else {
                        self.hidden[val] = 1;
                        e.target.src = 'images/invisible.png';
                        $("#"+e.target.id).attr("title","Show Layer");
                    }


                }
            }
        }
    }
    //var formattedVal = val.replace(/:/g,"colon");
    //self.render();
    //$("#"+self.id+" #"+formattedVal).parent().parent().remove();
    self.fire();
};

SOTE.widget.Bank.prototype.hideAllRadioExceptTop = function(){
    for(var i=0; i<this.categories.length - 1; i++){
        var formatted = this.categories[i].replace(/\s/g, "");
        formatted = formatted.toLowerCase();
        for(var j=1; j<this.values[formatted].length; j++){

            this.hidden[this.values[formatted][j].value] = 1;
            $('#hide'+this.values[formatted][j].value).attr("src",'images/invisible.png');

        }
    }
};

SOTE.widget.Bank.radioToggleValue = function(e){
    var self = e.data.self;
    var val = e.target.id.replace(/colon/g,":");
    var cat = -1;
    var hidden = false;
    val = val.replace(/hide/g,"");

    for(var i=0; i<self.categories.length; i++){
        var formatted = self.categories[i].replace(/\s/g, "");
        formatted = formatted.toLowerCase();
        if(self.values[formatted]){
            for(var j=0; j<self.values[formatted].length; j++){
                if(self.values[formatted][j].value == val){
                    if(val in self.hidden){
                        delete self.hidden[val];
                        e.target.src = 'images/visible.png';
                        for(var k=0; k<self.values[formatted].length; k++){
                            if(self.values[formatted][k].value != val){
                                self.hidden[self.values[formatted][k].value] = 1;
                                $('#hide'+self.values[formatted][k].value).attr("src",'images/invisible.png');
                            }
                        }
                    }
                    else {
                        self.hidden[val] = 1;
                        e.target.src = 'images/invisible.png';
                        if(j+1 < self.values[formatted].length){
                            if(self.hidden[self.values[formatted][j+1].value]){
                                delete     self.hidden[self.values[formatted][j+1].value];
                                $('#hide'+self.values[formatted][j+1].value).attr("src",'images/visible.png');
                            }
                        }
                        else {
                            if(self.hidden[self.values[formatted][0].value]){
                                delete     self.hidden[self.values[formatted][0].value];
                                $('#hide'+self.values[formatted][0].value).attr("src",'images/visible.png');

                            }
                        }
                    }

                }
            }
        }
    }


    //var formattedVal = val.replace(/:/g,"colon");
    //self.render();
    //$("#"+self.id+" #"+formattedVal).parent().parent().remove();
    self.fire();
};



/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Bank}
  *
*/
SOTE.widget.Bank.prototype.fire = function(){
    setTimeout(SOTE.widget.Bank.adjustCategoryHeights,1,{self:this});
    $("#"+this.id).trigger("fire");

    if(REGISTRY){
        REGISTRY.fire(this,this.noFireVal);
        this.noFireVal = null;
    }
    else{
        alert("No REGISTRY found! Cannot fire to REGISTRY from Bank!");
    }

};

/**
  * Sets the selected option(s) in the Bank from the passed in value(s), if valid
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {Bank}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.Bank.prototype.setValue = function(valString, selector){

    this.values = this.unserialize(valString, selector);
    var valid = true;
    var self = this;

    this.render();
    this.fire();

};

SOTE.widget.Bank.prototype.currCount = function(){
    return this.count;
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {Bank}
  * @returns {String} [container]=[options], options being a dot delimited string
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.Bank.prototype.getValue = function(){

    var value = this.serialize(this.values);
    return this.id + "=" + value;
};

SOTE.widget.Bank.prototype.value = function(){

    var value = this.serialize(this.values);
    return value;
};

SOTE.widget.Bank.prototype.serialize = function(values){
    var serialized = "";
    for(var i=0; i<this.categories.length; i++){
        if(i > 0){
            serialized += "~";
        }
        var formatted = this.categories[i].replace(/\s/g, "");
        formatted = formatted.toLowerCase();

        serialized += formatted;
        if(values[formatted]){
            for(var j=0; j<values[formatted].length; j++){
                if(!(values[formatted][j].value in this.hidden)){
                    serialized += "," + values[formatted][j].value;
                }else {
                    serialized += "," + "!" + values[formatted][j].value;
                }
            }
        }
    }
    return serialized;
};

SOTE.widget.Bank.prototype.unserialize = function(string, selector){
    var unserialized = new Object;
    var hideIndicator = /^!/;
    var categories = string.split("~");
    var values = [];
    this.count = 0;
    for(var i=0; i<categories.length; i++){
        var items = categories[i].split(/[\.,]/);
        unserialized[items[0]] = new Array;
        for(var j=1; j<items.length; j++){
            if ( this.meta && !this.meta[items[j]] && !hideIndicator.test(items[j]) ) {
                this.log.warn("No such product: " + items[j]);
            } else {
                if(hideIndicator.test(items[j])){
                    items[j] = items[j].replace(/!/g, "");
                    this.hidden[items[j]] = 1;
                }
                else {
                    if(!selector){
                        delete this.hidden[items[j]];
                    }
                }

                unserialized[items[0]].push({"value":items[j]});
                values.push(items[j]);
                this.count++;
            }
        }

    }

    for(var key in this.hidden){
        if( values.indexOf(key) < 0 ){
            delete this.hidden[key];
        }
    }

    return unserialized;
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  *
  * @this {Bank}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  *
*/
SOTE.widget.Bank.prototype.updateComponent = function(querystring){
    var qs = (querystring === undefined)? "":querystring;
    /*SOTE.util.getJSON(
        this.dataSourceUrl+"?"+querystring,
        {self:this,qs:querystring},
        SOTE.widget.Bank.handleUpdateSuccess,
        SOTE.widget.Bank.handleUpdateFailure
    );*/
    SOTE.widget.Bank.handleUpdateSuccess(this,qs);
};

/**
  * Static function to handle a successful retrieval from the data accessor
  *
  * @this {Bank}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  *
*/
SOTE.widget.Bank.handleUpdateSuccess = function(self,qs){
    /*var expanded = SOTE.util.extractFromQuery("hazard",args.qs);
    data.expanded = (expanded !== undefined && expanded !== "" && expanded !== null)? expanded:data.expanded;
    data.selected = (data.selected === undefined || data.selected === "")? SOTE.util.extractFromQuery(args.self.id,args.self.getValue()):data.selected;*/
    var projection = SOTE.util.extractFromQuery("switch", qs);
    self.noFireVal = (SOTE.util.extractFromQuery("norecurse",qs) === "")? null: SOTE.util.extractFromQuery("norecurse",qs);
    if (projection === "") {
        projection = self.VALID_PROJECTIONS[0];
    } else if ($.inArray(projection, self.VALID_PROJECTIONS) < 0) {
        self.log.warn("Invalid projection: " + projection + ", using: " +
               self.VALID_PROJECTIONS[0]);
        projection = self.VALID_PROJECTIONS[0];
    }
    if(projection == self.state){
        var vals = SOTE.util.extractFromQuery("selectorbox",qs)
        self.setValue(vals, "selector");
    }
    else {
        self.state = projection;
        self.buildMeta();
    }
};

/**
  * Static function to handle a failed retrieval from the data accessor
  *
  * @this {Bank}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  *
*/
SOTE.widget.Bank.handleUpdateFailure = function(xhr,status,error,args){
    alert("Failed to load data accessor: " + error);
};


/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  *
  * @this {Bank}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.Bank.prototype.loadFromQuery = function(qs){
    var newState = SOTE.util.extractFromQuery("switch",qs);

    if (newState === "" ) {
        newState = "geographic";
    }
    if(this.state != newState){
        this.state = newState;
        this.updateComponent(qs);
    }
    else {
       this.sleep(SOTE.util.extractFromQuery(this.id,qs));
    }
};

SOTE.widget.Bank.prototype.sleep = function(v){
    SOTE.widget.Bank.loadValue({self:this,val:v});
};

SOTE.widget.Bank.loadValue = function(args){
    if(args.self.buildMetaDone == true) {
        // If products are not specified, use the defaults
        if ( args.val.length === 0 ) {
            args.self.setValue(args.self.selected[args.self.state]);
        } else {
          args.self.setValue(args.val);
      }
    }
    else {
        args.self.sleep(args.val);
    }
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  *
  * @this {Bank}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Bank.prototype.validate = function(){

    var isValid = true;
    return isValid;

};

SOTE.widget.Bank.prototype.setHeight = function(height){
    $("#"+this.id).css("height",height+"px");
    SOTE.widget.Bank.adjustCategoryHeights({self:this});
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {Bank}
  * @param {String} datasourceurl is the relative location of the data accessor
  *
*/
SOTE.widget.Bank.prototype.setDataSourceUrl = function(dataSourceUrl){
    this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  *
  * @this {Bank}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Bank.prototype.getDataSourceUrl = function(){
    return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {Bank}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Bank.prototype.setStatus = function(s){
    this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {Bank}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Bank.prototype.getStatus = function(){
    return this.statusStr;
};


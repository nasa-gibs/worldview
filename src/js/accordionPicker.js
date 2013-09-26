SOTE.namespace("SOTE.widget.AccordionPicker");

SOTE.widget.AccordionPicker.prototype = new SOTE.widget.Component;

/**
  * A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories.  
  *
  * @module SOTE.widget
  * @class AccordionPicker
  * @constructor
  * @this {AccordionPicker}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.AccordionPicker = function(containerId, config){
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

    if(config.dataSourceUrl === undefined){
        config.dataSourceUrl = null;
    }

    if(config.items === undefined){
        config.items = null; 
    }

     if(config.selected === undefined){
        config.selected = null;
    }    
       
    this.value = "";
    //this.items = config.items;
    this.selected = config.selected;
    this.expanded = null;
    this.initRenderComplete = false;
    this.dataSourceUrl = config.dataSourceUrl;
    this.statusStr = "";
    this.init();
    this.updateComponent("");

};

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {AccordionPicker}
  * 
*/
SOTE.widget.AccordionPicker.prototype.init = function(){
    
    this.render();
    
    if(REGISTRY){
         REGISTRY.register(this.id,this);
    }
    else{
        alert("No REGISTRY found!  Cannot register AccordionPicker!");
    }
    
    
};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {AccordionPicker}
  * 
*/
SOTE.widget.AccordionPicker.prototype.render = function(){
    if(this.items === undefined){return false;}
    this.container.innerHTML = "";
    var htmlExpanded;
    var selected;
    var defaultSelection = null; 
    var accordion = document.createElement("form");
    accordion.setAttribute("class","accordion");
    accordion.setAttribute("id",this.id+"accordion");
    for(var category in this.items){
        if(category === "expanded"){
            if(this.items[category] !== undefined && this.items[category] !== ""){
                htmlExpanded = this.items[category].replace(" ","");
            }
            continue;
        }
        if(category === "selected"){
            selected = this.items[category];
            continue;
        }
        var htmlCategory = category.replace(" ","");
        var catHeader = document.createElement("a");
        catHeader.setAttribute("href","#");
        catHeader.setAttribute("id",this.id+htmlCategory );
        catHeader.innerHTML = "<span>"+category+"</span>";
        accordion.appendChild(catHeader);
        var catList = document.createElement("ul");
        for(var i=0; i < this.items[category].length; i++){
            var item = this.items[category][i];
            var catListItem = document.createElement("li");
            if(item.type !== "single" && item.type !== "multi"){
                alert("Invalid list item!");
            }
            else {
                var id = this.id + htmlCategory + "Item" + i;
                var disabled = (item.disabled !== undefined && item.disabled === true)? "disabled":""; 
                var type = (item.type === "single")? "radio":"checkbox"; 
                catListItem.innerHTML = "<input value='"+item.value+"' class='accordionFormItem' name='"+this.id+item.type+"' id='"+id+"' type='"+type+"'"+" "+disabled+"/>";
                catListItem.innerHTML += "<label for='"+id+"'><span class='accordionLabel'>"+item.label+"</span><span class='accordionSub'>"+item.sublabel+"</span></label>";
                catList.appendChild(catListItem);                
            } 
        }
        accordion.appendChild(catList);
    }
    this.container.appendChild(accordion);
    var accordionToggler = document.createElement("a");
    accordionToggler.setAttribute("class","accordionToggler atcollapse");
    this.isCollapsed = false;
    var e = new Object();
    e.data = new Object();
    e.data.self = this;
    //SOTE.widget.AccordionPicker.toggle(e,null);
    this.container.appendChild(accordionToggler);
    $('.accordionToggler').bind('click',{self:this},SOTE.widget.AccordionPicker.toggle);
    $('.accordion').accordion();
    $('.accordion').bind('accordionchange',{self:this},SOTE.widget.AccordionPicker.handleCategorySwitch);
    //$('.accordion').accordion("option","collapsible",true);
    $('.accordionFormItem').bind('click',{self:this},SOTE.widget.AccordionPicker.handleSelection);

    if(selected !== undefined && selected !== ""){
        this.setValue(htmlExpanded + "." + selected);
    }

    /*if(htmlExpanded !== undefined){
        $('.accordion').accordion("activate","#"+this.id+htmlExpanded);
        this.expanded = this.id + htmlExpanded;
        var activeBox = document.getElementById(this.id+htmlExpanded+"Item"+"0");
        if(activeBox !== null) activeBox.checked = true;
        this.fire();
    }*/ 

/*    else {
        this.setValue(defaultSelection);
    }*/

        // Mark the component as ready in the registry if called via init() 
    if ((this.initRenderComplete === false) && REGISTRY) {
        this.initRenderComplete = true;
        REGISTRY.markComponentReady(this.id);
    }
    
    
    
};

SOTE.widget.AccordionPicker.handleSelection = function(e){
    var self = e.data.self;
    self.syncCheckboxes(e.target);
    self.value = SOTE.util.extractFromQuery(self.id,self.getValue());
    self.fire();
};

SOTE.widget.AccordionPicker.toggle = function(e,ui){
    var self = e.data.self;
    if(self.isCollapsed){
        $('.accordionToggler').removeClass('atexpand').addClass('atcollapse');
        $('.accordionToggler').attr("title","Hide Products");
        $('.accordion').css('display','block');
        self.isCollapsed = false;
    }
    else{
        $('.accordionToggler').removeClass('atcollapse').addClass('atexpand');
        $('.accordionToggler').attr("title","Show Products");
        $('.accordion').css('display','none');
        self.isCollapsed = true;
    }     
};

SOTE.widget.AccordionPicker.handleCategorySwitch = function(e,ui){
    var self = e.data.self;
    var oldCategory = (ui.oldHeader[0].id);
    var newCategory = (ui.newHeader[0].id);
    var checkedRadio = null;
    var anyChecked = false;
    
    if(self.expanded !== newCategory){
        self.expanded = newCategory;
        var radioButtons = document.getElementsByName(self.id+"single");
        for(var i=0; i<radioButtons.length; ++i){
            if(radioButtons[i].disabled === false && radioButtons[i].id.indexOf(oldCategory) != -1 && radioButtons[i].checked === true){
                checkedRadio = radioButtons[i].value;
            }
        }
        if(checkedRadio !== null){
            for(var i=0; i<radioButtons.length; ++i){
                if(radioButtons[i].disabled === false && radioButtons[i].id.indexOf(newCategory) != -1 && radioButtons[i].value === checkedRadio){
                    radioButtons[i].checked = true;
                    anyChecked = true;
                }
            }
        }
        
        /*if(!anyChecked){
            var activeBox = document.getElementById(newCategory+"Item"+"0");
            var radioString = new String(self.id+"single");
            if(activeBox !== null && activeBox.name == radioString) self.setValue(self.expanded + "." + activeBox.value);
        }*/
        
        var categoryTest;
    }
    $('.accordion').blur();

};


/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {AccordionPicker}
  *
*/
SOTE.widget.AccordionPicker.prototype.fire = function(){

    if(REGISTRY){
        REGISTRY.fire(this);
    }
    else{
        alert("No REGISTRY found! Cannot fire to REGISTRY from AccordionPicker!");
    }

};

/**
  * Sets the selected option(s) in the AccordionPicker from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {AccordionPicker}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.AccordionPicker.prototype.setValue = function(values){
    var selectedItems = values.split(".");
    var expanded = selectedItems[0];
    var base = selectedItems[1];
    var radioButtons = document.getElementsByName(this.id+"single");
    var found = false;
    
    var expandedName = expanded;
    var reg = new RegExp(this.id+"(.+)");
    if(reg.test(expanded) == false){
        expandedName = this.id + expanded;
    }
    if(this.expanded === null || this.expanded !== expandedName) {
        $('.accordion').accordion("activate","#"+expandedName);
        this.expanded = expandedName;
    }
    
    for(var i=0; i < radioButtons.length; ++i){
        if(radioButtons[i].value === base && radioButtons[i].disabled === false && radioButtons[i].id.indexOf(expanded) != -1 ){
            radioButtons[i].checked = true;
            found = true;
            break;
        }
    }
    
    if(!found){
        for(var i=0; i < radioButtons.length; ++i){
            if(radioButtons[i].value === base && radioButtons[i].disabled === false){
                radioButtons[i].checked = true;
            }
        }
    }
    
    
    var checkboxes = document.getElementsByName(this.id+"multi");
    
    for(var i=0; i < checkboxes.length; ++i){
        for(var j=1; j < selectedItems.length; ++j){
            if(checkboxes[i].value === selectedItems[j] && checkboxes[i].disabled === false){
                checkboxes[i].checked = true;
            }
        }
    }
    
    this.value = values;
    this.fire();
    $('.accordion').blur();
    return this.validate();
    
};

/**
  * Sets the selected option(s) in the AccordionPicker from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {AccordionPicker}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.AccordionPicker.prototype.syncCheckboxes = function(targetEl){    
    var targetState = targetEl.checked;
    var checkboxes = document.getElementsByName(this.id+"multi");
    
    for(var i=0; i < checkboxes.length; ++i){
            if(checkboxes[i].value === targetEl.value && checkboxes[i].disabled === false){
                checkboxes[i].checked = targetState;
            }
    }
    
    return;
    
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {AccordionPicker}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.AccordionPicker.prototype.getValue = function(){
    var selected = new Array();
    var added = new Object();
    var radioButtons = document.getElementsByName(this.id+"single");
    
    for(var i=0; i < radioButtons.length; ++i){
        if(radioButtons[i].checked === true){
            selected.push(radioButtons[i].value);
            break;
        }
    }
    
    if(selected.length === 0){ selected.push(""); };
    
    var checkboxes = document.getElementsByName(this.id+"multi");
    
    for(var i=0; i < checkboxes.length; ++i){
        if(checkboxes[i].checked === true){
            if(! (checkboxes[i].value in added) ){
                selected.push(checkboxes[i].value);
                added[checkboxes[i].value] = 1;
            }
        }
    }
    
    var reg = new RegExp(this.id+"(.+)");
    
    var expanded = reg.exec(this.expanded);
    
    var value = expanded[1] + "." + selected.join(".");
    return this.id + "=" + value;
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {AccordionPicker}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.AccordionPicker.prototype.updateComponent = function(querystring){
    var qs = (querystring === undefined)? "":querystring;
    SOTE.util.getJSON(
        this.dataSourceUrl+"?"+querystring,
        {self:this,qs:querystring},
        SOTE.widget.AccordionPicker.handleUpdateSuccess,
        SOTE.widget.AccordionPicker.handleUpdateFailure
    );
};

/**
  * Static function to handle a successful retrieval from the data accessor
  * 
  * @this {AccordionPicker}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  * 
*/
SOTE.widget.AccordionPicker.handleUpdateSuccess = function(data,status,xhr,args){
    var expanded = SOTE.util.extractFromQuery("hazard",args.qs);
    data.expanded = (expanded !== undefined && expanded !== "" && expanded !== null)? expanded:data.expanded;
    data.selected = (data.selected === undefined || data.selected === "")? SOTE.util.extractFromQuery(args.self.id,args.self.getValue()):data.selected;
    args.self.items = data;
    args.self.render();
};
 
/**
  * Static function to handle a failed retrieval from the data accessor
  * 
  * @this {AccordionPicker}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  * 
*/
SOTE.widget.AccordionPicker.handleUpdateFailure = function(xhr,status,error,args){
    alert("Failed to load data accessor: " + error);
};


/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {AccordionPicker}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.AccordionPicker.prototype.loadFromQuery = function(qs){
    return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {AccordionPicker}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.AccordionPicker.prototype.validate = function(){
    var isValid = true;
    var radioCount = 0;
    var radioButtons = document.getElementsByName(this.id+"single");
    
    for(var i=0; i < radioButtons.length; ++i){
        if(radioButtons[i].checked === true){
            ++radioCount;
        }
        if(radioButtons[i].disabled === true && radioButtons[i].checked === true){
            this.setStatus("Disabled items cannot be selected!");
            isValid = false;
        }
    }
    
    if(radioCount > 1){
        isValid = false;
        this.setStatus("Multiple single-select items selected!");
    }
    
    return isValid;

};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {AccordionPicker}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.AccordionPicker.prototype.setDataSourceUrl = function(dataSourceUrl){
    this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {AccordionPicker}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.AccordionPicker.prototype.getDataSourceUrl = function(){
    return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {AccordionPicker}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.AccordionPicker.prototype.setStatus = function(s){
    this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {AccordionPicker}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.AccordionPicker.prototype.getStatus = function(){
    return this.statusStr;
};


// Additional Functions
// removeOptions, addOptions

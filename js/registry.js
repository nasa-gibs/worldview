// establish the component namespace
SOTE.namespace("util");
// component constructor
SOTE.util.Registry = function () {
  // holds the components that have registered
  this.compRegistry = new Array();
  // holds events that have been registered
  this.evtRegistry = new Array();
  // holds consumers
  this.consumers = new Array();
  // holds list of component ids that have marked themselves as ready
  this.readyRegistry = new Array();
  // holds array of callbacks for when all components are ready
  this.allReadyCallbacks = new Array();

  // register a component
  this.register = function register(id,component){
    var compObj = new ComponentObj(id,component);
    this.storeComponent( id, compObj );
  }

  // registry component object - this is what is actually held in compRegistry
  function ComponentObj(id,obj){
    this.name = id;
    this.obj = obj;
    return this;
  }

  function ConsumerProducerPair(cid,pid){
    this.consumerId = cid;
    this.producerId = pid;
    return this;
  }

  // add a listener pair - producer and consumer; can have multiple consumers
  this.addEventListener = function addEventListener(producerId, consumerId){
    if(consumerId != null || consumerId != 'undefined' || consumerId != ""){
      for(var i=1;i<arguments.length;i++){
        var evtObj = new ComponentUpdateObj(producerId,arguments[i]);
        var consObj = new Consumer(arguments[i], evtObj);
	//alert("Registry: storing: producer: "+producerId+", event object name: "+evtObj.name+", consumer: "+arguments[i]);
        this.storeEvent(producerId,evtObj);

	this.consumers.push(new ConsumerProducerPair(arguments[i],producerId));
      }
    }
  }
  // store an event in evtRegistry
  this.storeEvent = function storeEvent(name,evtObj){
    //var eo;
    //for(var i=0;i<this.evtRegistry.length;i++){
    //  eo = this.evtRegistry[i];
    //  if( name == eo.name ){
    //    this.evtRegistry.splice(i,1);
    //	  break;
    //  }
    //} 
    this.evtRegistry.push(evtObj);
  }
  // get an event from evtRegistry given a producer id
  this.getEvents = function getEvents(id){
    var eoA = new Array();
    for(var i=0;i<this.evtRegistry.length;i++){
      if( id == this.evtRegistry[i].name ){
	//alert("Registry: getEvent: id: "+id+" eo.name: "+this.evtRegistry[i].name);
	eoA.push( this.evtRegistry[i] );
      }
    }
    return eoA;
  }
  // fire an event
  this.fire = function fire(comp,noFireVal){
    if(noFireVal == null){
      noFireVal = "norecurse=xxx";
    }
    if(comp != null){ 
      var evtObjA = this.getEvents(this.getComponentId(comp));
      if(evtObjA.length > 0){
	//alert("Registry: fire: comp val: "+comp.getValue());
	var consumers = new Array();
        for(var i=0;i<evtObjA.length;i++){
	  consumers = this.getConsumers( evtObjA[i].consumerId );
	  //if(i==0){ alert("consumer: "+evtObjA[i].consumerId+", consumers len: "+consumers.length); }
	  var recursive = "";
	  for(var j=0;j<consumers.length;j++){
	    //if(i==0){ alert("consumer "+j+": "+consumers[j]); }
            if(consumers[j] == this.getComponentId(comp)){
	      recursive = consumers[j];
	      break;
	    }
	  } 
	  //alert("Registry: fire: producer: "+this.getComponentId(comp)+", evtObj: "+evtObjA[i].consumerId+", recursive: "+recursive+", no fire val: "+noFireVal);
	  if(evtObjA[i].consumerId != noFireVal.split("=")[1]){
	    /*if(recursive.length > 0){ 
              evtObjA[i].componentUpdate.fire(comp.getValue()+"&norecurse="+recursive);
	    }else{*/
              evtObjA[i].componentUpdate.fire(comp.getValue());
	    //}
	  }
        }
      }
    }else{
      alert("Registry: fire: comp is null"); 
    }
  }

  this.syncComponents = function() {
    // get the components
    var comps = this.getComponents();
    // determine which are producers
    var producers = new Array();
    var tmpA;
    for(var i=0;i<comps.length;i++){
      tmpA = this.getProducers(comps[i].id);
      if(tmpA.length > 0){
        producers = producers.concat(tmpA);
      }
    }
    //SOTE.util.uniqueArray(producers);
    for(var i=0;i<producers.length;i++){
	this.fire(this.getComponent(producers[i]));
    }
  }

  // given a consumer, find it's dependencies, gather the components that are supposed to update
  // and pass back their 'getValue's to the fire event
  this.getDependentValues = function (consumerId,producerId){
    // foreach consumerid, find it's producerids, get the components and get their values
    //alert("Registry: getDependentValues: consumerId: "+consumerId+", producerId: "+producerId);
    var val = "";
    for(var i=0;i<this.consumers.length;i++){
      if(this.consumers[i].consumerId == consumerId && this.consumers[i].producerId != producerId){
	val += this.getComponent(this.consumers[i].producerId).getValue() + "&";
      }
    }
    val = val.substring(0,val.length - 1);
    //alert("getDependenValues: cid: "+consumerId+", pid: "+producerId+", values: "+val);
    return val;
  }

  // custom event object
  function ComponentUpdateObj(name,consumerId) {
    // producer id/name
    this.name = name;
    // consumer id
    this.consumerId = consumerId;
    // define a custom event
    this.componentUpdate = new YAHOO.util.CustomEvent("componentUpdate", this);
    return this;
  }

  // an object that consumes "componentUpdate" events
  function Consumer(name, evtObj) {
    // consumer id/name
    this.name = name;
    // evtObj associated with producer
    this.evtObj = evtObj;
    this.evtObj.componentUpdate.subscribe(this.onComponentUpdate, this);
    return this;
  }

  // the callback of the 'fire' (componentUpdate, really) method
  Consumer.prototype.onComponentUpdate = function(type, args, me) {

    //alert(" "+
    //    "\n this: " + this.name +
    //    "\n producer event name (type): " + type +
    //    "\n data: " + args +
    //	"\n event obj name: "+ me.evtObj.name +
    //    "\n me.name: " + me.name.id);

    //alert("Registry: onComponentUpdate: producer: "+this.name+" consumer: "+me.name+", args for the update: "+args);

    // are there other producers for this consumer?
    var additionalValues = getRegistryDependentValues(me.name, this.name);
    if(additionalValues != ""){
      args = args + "&" + additionalValues;
    }
    // get physical comp and do the update
    var comp = getGComponent(me.name);
    if(comp != null){
      comp.updateComponent(args);
    }
  }

  // add a consumer to consumers
  this.addConsumer = function addConsumer(consumer){
    var co;
    for(var i=0;i<this.consumers.length;i++){
      co = this.consumers[i];
      if( consumer.id == co.id ){
        this.consumers.splice(i,1);
        break;
      }
    }
    this.consumers.push(consumer);
  }
  // get a consumer object from consumers
  this.getConsumer = function getConsumer(id){
    var co;
    for(var i=0;i<this.consumers.length;i++){
      co = this.consumers[i];
      if( id == co.id ){
	break;
      }
    }
    return co;
  }


  // store a registry component object in compRegistry
  this.storeComponent = function storeComponent(name,comp) {
    var co;
    for(var i=0;i<this.compRegistry.length;i++){
      co = this.compRegistry[i];
      if( name == co.name ){
        this.compRegistry.splice(i,1);
        break;
      }
    }
    this.compRegistry.push(comp);
  }

  // get a registry component object from compRegistry given an id
  this.getComponent = function getComponent(id) {
    var co;
    for(var i=0;i<this.compRegistry.length;i++){
      co = this.compRegistry[i];
      if( id == co.name ){
        break;
      }
    }
    return co.obj;
  }

  // get the component id for the component registered in compRegistry
  this.getComponentId = function getComponentId(obj) {
    var co;
    for(var i=0;i<this.compRegistry.length;i++){
      co = this.compRegistry[i];
      if( obj == co.obj ){
        break;
      }
    }
    return co.name;
  }

  // get all of the components in compRegistry 
  this.getComponents = function getComponents() {
    var coA = new Array();
    for(var i=0;i<this.compRegistry.length;i++){
      coA.push(this.compRegistry[i]);
    }
    return coA;
  }

// Checks that all components are ready and fires off the callbacks if the are.
  this.checkComponentsReady = function checkComponentsReady() {
    // Determine if every registered components has marked themselves as ready
    // Essentially, see if relevant components are a subset of readyRegistry.
    var allReady = true;
    var comps = this.getComponents();
    for (var i=0; i < comps.length; i++) {
      if (comps[i].obj.loadFromQuery == undefined)
	continue;  // not considered

      // see if comps[i].name is in readyRegistry.
      var found = false;
      for (var j=0; j < this.readyRegistry.length; j++) {
        if (this.readyRegistry[j] == comps[i].name) {
          found = true;
        }
      }
	 
      if (!found) {
        allReady = false;
	break;
      }
    }
    
    // Call all callbacks if all components ready
    if (allReady) {
      for (var i=0; i < this.allReadyCallbacks.length; i++) {
        var callback = this.allReadyCallbacks[i];
        callback();
       }
    }
  }

  // Adds a callback function to be called once all components are ready.
  this.addAllReadyCallback = function addAllReadyCallback(callback) {
    this.allReadyCallbacks.push(callback);
    this.checkComponentsReady(); // just in case all were marked before callback added
  }
 
  // Method for registered components to call when they are ready.
  this.markComponentReady = function markComponentReady(id) {
    this.readyRegistry.push(id);
    this.checkComponentsReady(); // will check make necessary action if so
  }

  // get all of the user interface (selection) components in compRegistry 
  this.getUIComponents = function getUIComponents() {
    var rawA = this.getComponents();
    var coA = new Array();
    for(var i=0;i<rawA.length;i++){
      if(rawA[i].obj.loadFromQuery){
        coA.push(rawA[i].obj);
      }
    }
    return coA;
  }

  this.getProducers = function getProducers(consumerId) {
    var producers = new Array();
    for(var i=0;i<this.consumers.length;i++){
      if(this.consumers[i].consumerId == consumerId){
        producers.push(this.consumers[i].producerId);
      }
    }
    return producers;
  }

  this.getConsumers = function getConsumers(producerId) {
    var consumers = new Array();
    for(var i=0;i<this.consumers.length;i++){
      if(this.consumers[i].producerId == producerId){
        consumers.push(this.consumers[i].consumerId);
      }
    }
    return consumers;
  }


};

// globally exposed instance of this class
var REGISTRY = new SOTE.util.Registry();

// an external function for getting components; useful in event methods
function getGComponent(id){
  return REGISTRY.getComponent(id);
}

function getRegistryDependentValues(cid,pid){
  // get the producers for the given consumer (except for the one passed in)
  // and get the values
  return REGISTRY.getDependentValues(cid,pid);
}


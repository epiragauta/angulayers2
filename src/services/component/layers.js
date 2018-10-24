/**
 * @license Angulayers2. Based on AzimuthJS
 *
 * (c) 2018 epiragauta
 * License: MIT
 */
(function() {
angular.module('angulayers.services').
factory('angulayers.services.layers', function($rootScope) {
    var layerService = {
    	layers: [],
    	getMapLayers: function(){
    		var lyrs = [];
    		$.each(this.layers,function(i,lyr){
    			if(lyr.mapLayer !== false){
    				lyrs.push(lyr);
    			}
    		});
    		return lyrs;
    	}
    };
    return layerService;
  });

})()

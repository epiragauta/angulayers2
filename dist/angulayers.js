/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
 * License: MIT
 */
(function() {

angular.module('angulayers.directives').
	directive('azLayer', ['angulayers.config','angulayers.services.layers', '$parse', function(config,layerService, $parse) {
		var defaults = config.defaults;
		var MAP_DIRECTIVES = ['ol-map','leaflet-map']
		var inmapQuery = '';
		$.each(MAP_DIRECTIVES, function(n, val){
			if(n>0) inmapQuery += ',';
			inmapQuery += '*[' + val + '], ' + val;
		});

		var lyrDir = {
			restrict: 'EA',
			replace: true,
			html: '',
			scope:{},
			link: function(scope, elem, attrs) {
				var opts = {};
				//filter out the prototype attributes && evaluate attributes
				$.each(attrs,function(key, val){
					if(attrs.hasOwnProperty(key) && !angular.isObject(val) && !angular.isFunction(val)){
						var pval;
						try{
							pval = scope.$eval(val);
						} catch (e){
							pval = undefined;
						}
						opts[key] = angular.isDefined(pval) ? pval : val;
						//check for special case
						//TODO may want a more generally applicable test
						if(key == 'version' && isNaN(pval)){
							opts[key] = val;
						}
					}
				});
				opts = angular.extend(opts, opts.lyrOptions);
				var type = attrs.lyrType;
				var url = attrs.lyrUrl;
				delete opts.lyrOptions; delete opts.lyrType; delete opts.lyrUrl;
				var name = attrs.name;
				var layers = layerService.layers;
				var inmap = elem.parents(inmapQuery).length>0;
				var maplib = typeof(OpenLayers) != 'undefined' ? 'ol' : typeof(L) != 'undefined' ? 'leaflet' : null;
				if(opts.maplib){maplib = opts.maplib}
				var lyrConstruct;
				switch(type){
					case 'tiles':
						lyrConstruct = maplib=='ol' ? ol_tiles : leaflet_tiles;
						break
					case 'wms':
						lyrConstruct = maplib=='ol' ? ol_wms : leaflet_wms;
						break
					case 'geojson':
						lyrConstruct = maplib=='ol' ? ol_geojson : leaflet_geojson;
						break
				}
				var layer = lyrConstruct(name, url, opts, inmap);
				if(layer){layers[maplib=='ol' ? "push" : "unshift"](layer);}
				console.log(layers);
			}
		};

		var ol_geojson = function(name, url, opts, inmap){
				var lyrOptKeys = ['style', 'styleMap', 'filter', 'projection'];
				var lyrOpt = {'mapLayer':inmap};
				$.each(lyrOptKeys, function(index, val) {
					if(val in opts) {
						lyrOpt[val] = opts[val];
						delete opts[val];
					}
				});
				var layer = new OpenLayers.Layer.Vector(name, angular.extend({
					protocol: new OpenLayers.Protocol.HTTP(angular.extend({
						'url': url,
						format: new OpenLayers.Format.GeoJSON()
					}, opts)),
					strategies: [opts.strategy || new OpenLayers.Strategy.Fixed()]
				}, lyrOpt));
				return layer;
			},
		leaflet_geojson = function(name, url, opts, inmap){
				var lyrOptKeys = ['pointToLayer','style','filter','onEachFeature'];
				var lyrOpt = {'mapLayer':inmap, name: opts.name || 'Vector'};
				$.each(lyrOptKeys, function(index, val) {
					if(val in opts) {
						lyrOpt[val] = opts[val];
						delete opts[val];
					}
				});
				var layer = L.geoJson(null,lyrOpt);
				$.ajax({
					dataType: 'json',
					'url': url,
					data: opts.params,
					success: function(data){
						layer.addData(data);
					}
				});
				return layer;
			},
		ol_wms = function(name, url, opts, inmap){
				var paramKeys = ['styles', 'layers', 'version', 'format', 'exceptions', 'transparent', 'crs'];
				var params = {};
				$.each(paramKeys, function(index, val) {
					if(val in opts) {
						params[val] =  opts[val];
						delete opts[val];
					}
				});
				var layer = new OpenLayers.Layer.WMS(name, url, params, opts);
				layer.mapLayer = inmap;
				return layer
			},
		leaflet_wms = function(name, url, opts, inmap){
				url = url.replace(/\${/g, '{');
				if(opts.transparent && (!opts.format || opts.format.indexOf('jpg')>-1)){
					opts.format = 'image/png';
				}
				var layer = L.tileLayer.wms(url, angular.extend({
					mapLayer: inmap
				}, opts)).on('loading',function(e){
					var lyr = e.target, projKey = lyr.wmsParams.version >= '1.3' ? 'crs' : 'srs';
					if(opts[projKey] != lyr.wmsParams[projKey]){
						//if someone went to the trouble to set it, let them keep it that way.
						//lots of WMS servers only accept certain crs codes which are aliases
						//for the ones defined in Leaflet. ie reject EPSG:3857 but accept EPSG:102113
						lyr.wmsParams[projKey] = opts[projKey];
					}
				});
				
				return layer;
			},
		ol_tiles = function(name, url, opts, inmap){
				var subdomains = opts.subdomains !== false && (opts.subdomains || defaults.SUBDOMAINS);
				if(!url) {
					url = defaults.TILE_URL
				}
				var urls = [];
				var splitUrl = url.split('${s}');
				if(subdomains && splitUrl.length>1) {
					delete opts.subdomains;
					$.each(subdomains, function(index, val) {
						urls[index] =
							OpenLayers.String.format(splitUrl[0]+'${s}',angular.extend(opts,{s:val})) + splitUrl[1];
					});
				} else {
					urls = [url]
				}

				var layer = new OpenLayers.Layer.XYZ(name, urls, angular.extend({
					projection: 'EPSG:'+defaults.CRS,
					transitionEffect: 'resize',
					wrapDateLine: true
				}, opts));
				layer.mapLayer = inmap;
				return layer;
			},
		leaflet_tiles = function(name, url, opts, inmap){
				var subdomains = opts.subdomains !== false && (opts.subdomains || defaults.SUBDOMAINS);
				if(!url) {
					url = defaults.TILE_URL
				}
				url = url.replace(/\${/g, '{');
				var layer = L.tileLayer(url, angular.extend({
					mapLayer: inmap,
					'subdomains': subdomains
				}, opts));
				return layer;
			}
		return lyrDir;
	}]);
})()
/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
 * License: MIT
 */
/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
 * License: MIT
 */

(function() {

	var mod = angular.module('angulayers.directives');

	mod.directive('leafletMap', ['angulayers.config','angulayers.services.layers', '$parse', function(config, layerService, $parse) {
		var defaults = config.defaults,
		addLayerCtl = function(map, layers, opts){
			var baseLyrs = {}, overLyrs = {};
			$.each(layers, function(i,lyr){
				if(lyr.options.isBaseLayer===true){baseLyrs[lyr.options.name] = lyr}
				else{overLyrs[lyr.options.name] = lyr}
			})
			L.control.layers(baseLyrs,overLyrs,opts).addTo(map);
		},
		addScaleCtl = function(map, opts){
			L.control.scale(opts).addTo(map);
		};
		return {
			restrict: 'EA',
			priority: -10,
			link: function(scope, elem, attrs) {
				var layers = layerService.getMapLayers();
				var center = attrs.center ? attrs.center.split(',') : defaults.CENTER.split(',');
				var zoom = attrs.zoom || defaults.ZOOM;
				var projection = attrs.projection || attrs.proj || attrs.crs || L.CRS['EPSG'+defaults.CRS];
				var controls = attrs.controls ? attrs.controls.split(',') : [];
				var controlOptions = angular.extend({}, $parse(attrs.controlOpts)());
				var opts = angular.extend({}, $parse(attrs.mapOpts)());
				
				var map = L.map(elem[0],angular.extend({
					'crs':projection,
					'center':center,
					'zoom':zoom,
					'layers':layers
				}, opts));

				$.each(controls,function(i,ctl){
					var opts = controlOptions[ctl] || undefined;
					switch(ctl){
						case 'layers':
							addLayerCtl(map,layers,opts);
							break;
						case 'scale':
							addScaleCtl(map,opts);
							break;
					}
				});
			}
		}
	}]);
})()
/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
 * License: MIT
 */
(function() {

    angular.module('angulayers.directives').
    directive('olMap', ['angulayers.config', 'angulayers.services.layers', /*'angulayers.services.map',*/ '$parse',
        function(config, layerService, /*mapService,*/ $parse) {
        var defaults = config.defaults;
        return {
            restrict: 'EA',
            priority: -10,
            link: function(scope, elem, attrs) {
                var layers = layerService.getMapLayers();
                var center = attrs.center ? attrs.center.split(',') : defaults.CENTER.split(',').reverse();
                var zoom = attrs.zoom || defaults.ZOOM;
                var projection = attrs.projection || attrs.proj || attrs.crs || 'EPSG:' + defaults.CRS;
                var dispProj = attrs.dispProjection || attrs.dispProj || 'EPSG:' + defaults.DISP_CRS;
                var controls = (attrs.controls || defaults.OL_CONTROLS).split(',');
                var controlOptions = angular.extend(defaults.OL_CTRL_OPTS, $parse(attrs.controlOpts)());
                var mapCtls = [];
                $.each(controls, function(i, ctl) {
                    var opts = controlOptions[ctl] || undefined;
                    ctl = ctl.replace(/^\w/, function(m) {
                        return m.toUpperCase()
                    });
                    mapCtls.push(new OpenLayers.Control[ctl](opts));
                });
                var listeners = {};
                $.each(attrs, function(key, val) {
                    var evtType = key.match(/map([A-Z]\w+)/);
                    if(evtType) {
                        evtType = evtType[1].replace(/^[A-Z]/,function(m){return m.toLowerCase()});
                        var $event = {
                            type: key
                        };
                        listeners[evtType] = function(evtObj) {
                            evtObj.evtType = evtObj.type;
                            delete evtObj.type;
                            elem.trigger(angular.extend({}, $event, evtObj));
                            //We create an $apply if it isn't happening.
                            //copied from angular-ui uiMap class
                            if(!scope.$$phase) scope.$apply();
                        };
                        var fn = $parse(val);
                        elem.bind(key, function (evt) {
                          fn(scope, evt);
						});
                    }
                });
                center = new OpenLayers.LonLat(center).transform('EPSG:4326', projection);
                var map = new OpenLayers.Map(elem[0], {
                    'projection': projection,
                    'displayProjection': dispProj,
                    'controls': mapCtls,
                    'center': center,
                    'zoom': zoom,
                    'layers': layers,
                    'eventListeners': listeners
                });
                var model = $parse(attrs.olMap);
                //Set scope variable for the map
                if(model){model.assign(scope, map);}
                //mapService.map = map;
            }
        };
    }]);
})();

/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
 * License: MIT
 */
angular.module('angulayers.config', []).value('angulayers.config', {
	defaults:{
		CENTER: '38,-99',
		ZOOM: 5,
		CRS: '3857',
		DISP_CRS:'4326',
		OL_CONTROLS:'zoom,navigation,attribution',
		OL_CTRL_OPTS:{},
		TILE_URL:"http://otile${s}.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
		SUBDOMAINS:[1,2,3,4]
	}
});
angular.module('angulayers.services',['angulayers.config']);
angular.module('angulayers.directives',['angulayers.services', 'angulayers.config']);
angular.module('angulayers', ['angulayers.services', 'angulayers.directives', 'angulayers.config']);
/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
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

/**
 * @license Angulayers. Based on AzimuthJS
 *
 * (c) 2014 jacruzca
 * License: MIT
 */
(function() {
    angular.module('angulayers.services').
    value('angulayers.services.map', {
        map: null
    })
})
()
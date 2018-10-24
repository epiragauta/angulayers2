/**
 * @license Angulayers2. Based on AzimuthJS
 *
 * (c) 2018 epiragauta
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
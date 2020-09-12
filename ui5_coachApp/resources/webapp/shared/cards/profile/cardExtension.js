sap.ui.define([ "sap/ui/integration/Extension", "ru/fitrepublic/shared/model/appMgr" ], function (Extension, AppMgr) {
	"use strict";
	
	var oExtension = new Extension({
		formatters:{
			toIconTextNickName: function (nickName) {
				return nickName.substring(0,2).toUpperCase() || '??';
			},			
			toIconTextName: function (name) {
				var split=name.split(" ");
				return (split[0][0]+split[1][0]).toUpperCase();
			}
		},
		// actions:[{
		// 	type: "Custom",
		// 	enabled: function(){ return AppMgr.getOnlineMode(); },
		// 	parameters :{ "dst":"refresh"},
		// 	icon: "sap-icon://refresh",
		// 	text: AppMgr.geti18n("genericRefresh")
		// }]
	});
	
	oExtension.getData = function () {
		return AppMgr.getProfile();
	};

	return oExtension;
});
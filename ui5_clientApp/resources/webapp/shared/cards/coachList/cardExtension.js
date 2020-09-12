sap.ui.define([ "sap/ui/integration/Extension", "ru/fitrepublic/shared/model/appMgr" ], function (Extension, AppMgr) {
	"use strict";
	
	var oExtension = new Extension({
		formatters:{
			somFn: function () {
				return '';
			}
		},
		actions:[{
			type: "Custom",
			enabled: function(){ return AppMgr.getOnlineMode(); },
			parameters :{ "dst":"refresh"},
			icon: "sap-icon://refresh",
			text: AppMgr.geti18n("genericRefresh")
		}]
	});

	return oExtension;
});
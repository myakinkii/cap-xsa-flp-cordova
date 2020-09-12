sap.ui.define([ "sap/ui/integration/Extension", "ru/fitrepublic/shared/model/appMgr" ], function (Extension, AppMgr) {
	"use strict";
	
	var oExtension = new Extension({
		formatters:{
			toDescription: function (pType,displayName,gymName) {
				return displayName+(pType=='R'?' @'+gymName:'');
			},
			toIcon: function (pType) {
				return 'sap-icon://'+(pType=='R'?'official-service':'home-share');
			},			
			toHighlight: function (pType, pState) {
				return pState=='A'?'Success':'Error';
			},
			toInfoState: function (pType, pState) {
				return pType=='R'?'None':'Information';
			},
			toInfoValue: function (pType,pState, quantity) {
				return quantity+(pType=='O'?AppMgr.geti18n('purchaseType_O_Unit'):'');
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
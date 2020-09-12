sap.ui.define([ "sap/ui/core/UIComponent", "ru/fitrepublic/shared/model/appMgr"],function(UIComponent, AppMgr) {
	"use strict";
	return UIComponent.extend("ru.fitrepublic.cards.chatMessages.Component", {
		
		metadata : {
			manifest: "json"
		},
				
		getCard:function(){
			return this.card;
		},
		
		geti18n:function(prop, arr) {
			return AppMgr.geti18n(prop, arr);
		},

		onCardReady: function (oCard) {
			this.card=oCard;
			this.setModel(AppMgr.getOdataModel(),"odata");
			this.initPromise=AppMgr.promisedRead('/MyActivePurchases',{"$orderby":"gymName,displayName"});
		}
		
	});
});
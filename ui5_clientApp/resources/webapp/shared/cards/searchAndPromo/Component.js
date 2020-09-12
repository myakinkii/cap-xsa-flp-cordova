sap.ui.define([ "sap/ui/core/UIComponent", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel"
],function(UIComponent, AppMgr, JSONModel) {
	"use strict";
	return UIComponent.extend("ru.fitrepublic.cards.searchAndPromo.Component", {
		
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
			if (!AppMgr.getOnlineMode()) this.setModel(new JSONModel({options:[]}),"promo");
			else AppMgr.getPromoData().then(function(promoData){
				this.setModel(new JSONModel(promoData),"promo");
			}.bind(this));			
			/*
			// for some reason this has no effect
			// but we can add it with cardExtension as with 'regular' cards
			var host=oCard.getHostInstance();
			var actions=host.getActions();
			actions.push({
				type: "Custom",
				enabled: function(){ return AppMgr.getOnlineMode(); },
				parameters :{ "dst":"refresh"},
				icon: "sap-icon://refresh",
				text: AppMgr.geti18n("genericRefresh")
			});
			host.setActions(actions);
			*/
		}
	});
});
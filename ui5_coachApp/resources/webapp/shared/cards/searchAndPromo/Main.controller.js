sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller,JSONModel) {
	"use strict";

	return Controller.extend("ru.fitrepublic.cards.searchAndPromo.Main", {
		
		onInit: function () {
			
		},
		
		formatDate:function(dateStr){
			 var d=new Date(dateStr);
			 //var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
			 //return this.getOwnerComponent().geti18n('promoDate',[d.toLocaleDateString(undefined,options)]);
			 return this.getOwnerComponent().geti18n('promoDate',[d.toLocaleDateString()]);
		},
		
		formatPromoText:function(objType){
			return this.getOwnerComponent().geti18n('promoText_'+objType);
		},
		
		searchPress:function(e){
			var card=this.getOwnerComponent().getCard();
			card.fireAction({
				parameters:{
					dst:"search",
					vars:{ q:e.getParameter("query") }
				}
			});
		},
		
		promoPress:function(e){
			var card=this.getOwnerComponent().getCard();
			var ctx=e.getSource().getBindingContext("promo").getObject();
			card.fireAction({
				parameters:ctx.parameters
			});
		}
		
	});
});
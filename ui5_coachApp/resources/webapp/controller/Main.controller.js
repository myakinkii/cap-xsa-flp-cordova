sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr"
], function (Controller, AppMgr) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_coachApp.controller.Main", {

		onInit: function() {
			this.getRouter().getRoute("main").attachMatched(this.onRouteMatched, this);
		},		

		onRouteMatched: function() {
			this.getOwnerComponent().initPromise.then(function(){
				AppMgr.renderCards(this, this.getView().byId("cardContainer"));
			}.bind(this));
		}

	});
});
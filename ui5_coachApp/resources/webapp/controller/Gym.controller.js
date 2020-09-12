sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr"], function (Controller, AppMgr) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_coachApp.controller.Gym", {
		
		onInit: function() {
			this.getRouter().getRoute("gym").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var id=e.getParameter("arguments").id;
			var path="/Gyms(guid'"+id+"')";
			this.getView().bindElement({ path:path, model: "odata", parameters: { expand: "coaches,coaches/coach" } });
		},
		
		goToCoach:function(e){
			var id=e.getSource().getBindingContext("odata").getProperty("coach_id");
			this.getRouter().navTo("coach",{id:id});
		}
		
	});
});
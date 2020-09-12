sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"ru/fitrepublic/shared/model/addWorkoutDialog"
], function (Controller, AppMgr, WorkoutDlg) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Main", {
		
		onInit: function() {
			this.getRouter().getRoute("main").attachMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function() {
			this.getOwnerComponent().initPromise.then(function(){
				AppMgr.renderCards(this, this.getView().byId("cardContainer"));
			}.bind(this));
		},
		
		searchAndPromoActionHandler:function(pars){
			if (pars.dst=='search') {
				this.getRouter().navTo(pars.dst,pars.vars);
			} else if (pars.dst=='promo'){
				if (pars.vars.type=='coach' || pars.vars.type=='gym') this.getRouter().navTo(pars.vars.type,{id:pars.vars.id});
			} else if (pars.dst=='split') {
				this.showToast(JSON.stringify(pars.vars));
			} else this.showToast(JSON.stringify([pars.dst,pars.vars]));
		},
		
		calendarActionHandler:function(pars){
			if (pars.dst!='addWorkout') return this.getRouter().navTo(pars.dst,pars.vars);
			var self=this;
			WorkoutDlg.createWorkoutParams(this.getView()).then(function(workoutPars){
				return AppMgr.promisedCallFunction("/createWorkout",workoutPars);
			}).then(function(data){
				self.getRouter().navTo("workout",{id:data.value});
			}).catch(function(err){
				console.log(err);
			});
		}
	});
});
sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr"], function (Controller, AppMgr) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Onboard", {
		
		onInit: function() {
			this.onboarded=this.getOwnerComponent().getModel("profile")?true:false;
			this.getRouter().getRoute("onboard").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			this.deviceId=e.getParameter("arguments").id;
			if (this.onboarded) this.getRouter().navTo("main");
		},
		
		onboardMain:function(){
			var self=this;
			AppMgr.onboard(this.deviceId).then(function(fullProfile){
				self.onboarded=true;
				AppMgr.setProfile(fullProfile);
				self.getOwnerComponent().initPromise=AppMgr.init(self.getOwnerComponent(),fullProfile);
				return self.initPromise;
			}).then(function(initData){
				self.getRouter().navTo("profile");
			}).catch(function(err){
				console.log(err);
				// if for some weird reason init failing right after onboariding..
			});
		},
		
		_onboardMain:function(){
			this.onboarded=true;
			this.getRouter().navTo("main");
		},
		
		_onboardQR:function(){
			this.onboarded=true;
			var coachPars={id:'vas'};
			this.getRouter().navTo("coach",coachPars);
		}
	});
});
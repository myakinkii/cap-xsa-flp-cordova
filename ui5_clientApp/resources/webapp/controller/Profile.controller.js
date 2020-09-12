sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function (Controller, AppMgr, JSONModel, MessageBox) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Profile", {
		
		onInit: function() {
			this.getRouter().getRoute("profile").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var hiddenCards=AppMgr.getHiddenCards();
			var cards=AppMgr.getLocalCards().reduce(function(prev,cur){
				prev[cur.name] = !hiddenCards[cur.name];
				return prev;
			},{});
			var self=this;
			AppMgr.getProfile().then(function(profile){
				self.getView().setModel(new JSONModel({
					darkTheme:AppMgr.getDarkTheme(),
					profile:profile, 
					cards:cards
				}));
			});
		},
		
		toggleHiddenCards:function(){
			var hidden={};
			var cards=this.getView().getModel().getProperty('/cards');
			for (var c in cards) {
				if (cards[c]===false) hidden[c]=true;
			}
			AppMgr.setHiddenCards(hidden);
		},
		
		toggleDarkTheme:function(e){
			AppMgr.setDarkTheme(e.getParameter("state"));
			this.showToast(this.geti18n('profileDarkThemeRestartToApply'));
		},
		
		updateProfile:function(){
			var profile=this.getView().getModel().getProperty('/profile');
			var odataMdl=this.getView().getModel("odata");
			var self=this;
			self.setBusy();
			odataMdl.update("/Profiles(guid'"+profile.id+"')",{nickName: profile.nickName, age: profile.age},{
				success:function(data){
					AppMgr.setProfile(data);
					self.clearBusy();
				},
				error:function(err){
					console.log(err);
					self.clearBusy();
				}
			});
		},		
		
		resetProfile:function(){
			MessageBox.confirm(this.geti18n('profileConfirmReset'), function(action) {
				if (action == MessageBox.Action.OK) AppMgr.resetProfile();
			});
		}		
	});
});
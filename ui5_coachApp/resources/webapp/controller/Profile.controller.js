sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/GroupHeaderListItem"
], function (Controller, AppMgr, JSONModel, MessageBox, GroupHeaderListItem) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_coachApp.controller.Profile", {
		
		onInit: function() {
			this.getRouter().getRoute("profile").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var hiddenCards=AppMgr.getHiddenCards();
			var cards=AppMgr.getLocalCards().reduce(function(prev,cur){
				prev[cur.name] = !hiddenCards[cur.name];
				return prev;
			},{});
			var self=this, profile;
			self.setBusy();
			AppMgr.getProfile().then(function(p){
				profile=p;
				return Promise.all([
					AppMgr.promisedRead('/Gyms'),
					AppMgr.promisedRead('/CoachesToGyms',{
						'$expand':'gym',
						'$filter':"coach_id eq guid'"+profile.id+"'"
					})
				]);
			}).then(function(data){
				var allGyms=data[0].results || [];
				var mdl=allGyms.reduce(function(prev,cur){
					prev[cur.id]={ me:profile.id, gym:cur.id, name:cur.name, addr:cur.address_addressLine, type:cur.type, selected:false};
					return prev;
				},{});
				var myGyms=data[1].results || [];
				myGyms.forEach(function(g){
					if (mdl[g.gym_id]) mdl[g.gym_id].selected=true; 
				});
				return Promise.resolve(mdl);
			}).then(function(gyms){
				self.getView().setModel(new JSONModel({
					darkTheme:AppMgr.getDarkTheme(),
					profile:profile,
					gyms:gyms,
					cards:cards
				}));
				self.clearBusy();
			}).catch(function(err){
				console.log(err);
			});
		},
		
		getGroupHeader:function(oGroup){
			return new GroupHeaderListItem({
				title: this.geti18n('profileGymType_'+oGroup.key),
				type:'Inactive',
				upperCase: false
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
		
		handleGymToggle:function(e){
			var odataMdl=this.getView().getModel("odata");
			var ctx=e.getSource().getBindingContext().getObject();
			if (ctx.selected) odataMdl.create("/CoachesToGyms",{coach_id:ctx.me, gym_id:ctx.gym});
			else odataMdl.remove("/CoachesToGyms(coach_id=guid'"+ctx.me+"',gym_id=guid'"+ctx.gym+"')");
		},
		
		goToGym:function(e){
			var id=e.getSource().getBindingContext().getProperty("gym");
			this.getRouter().navTo("gym",{id:id});
		},
		
		updateProfile:function(){
			var profile=this.getView().getModel().getProperty('/profile');
			var odataMdl=this.getView().getModel("odata");
			var self=this;
			self.setBusy();
			odataMdl.update("/Profiles(guid'"+profile.id+"')",{nickName:profile.nickName},{
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
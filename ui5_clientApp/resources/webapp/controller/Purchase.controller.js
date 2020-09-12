sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	"ru/fitrepublic/shared/model/purchaseDialog",
	"ru/fitrepublic/shared/model/addWorkoutDialog"
], function (Controller, AppMgr, JSONModel, PurchaseDlg, WorkoutDlg) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Purchase", {
		
		onInit: function() {
			this.getRouter().getRoute("purchase").attachMatched(this.onRouteMatched, this);
			this.getView().setModel(new JSONModel({
				// timestamp:new Date(),
				// time:"12:00",
				chatMessage:''
			}));
		},
		
		onRouteMatched:function(e){
			var id=e.getParameter("arguments").id;
			var path="/Purchases(guid'"+id+"')";
			var section=e.getParameter("arguments").section;
			AppMgr.promisedRead(path,{'$expand':'coach,owner'}).then(function(data){
				this.prepareMessageAuthors(data);
				this.getView().bindElement({
					path:path, model: "odata", 
					// events: {  dataReceived:function(){} },
					parameters: {
						expand: "coach,owner,gym,workouts,chatChannel,chatChannel/messages,workouts/purchase,workouts/purchase/gym,workouts/coach"
					}
				});
				if (section) this.getView().byId("objectPageLayout").setSelectedSection(this.getView().byId(section));
			}.bind(this));
		},
		
		formatPurchaseState:function(stateCode){
			return this.geti18n('purchaseState')+': '+this.geti18n('purchaseState_'+stateCode);
		},
		
		formatPurchaseType:function(typeCode){
			return this.geti18n('purchaseType')+': '+this.geti18n('purchaseType_'+typeCode);
		},
		
		formatWorkoutStatus:function(statusCode){
			return this.geti18n('workoutStatus_'+statusCode);
		},
		
		addPayment:function(){
			var purch=this.getView().getBindingContext("odata").getObject();
			var self=this;
			PurchaseDlg.displayPurchaseOptions(this.getView(),purch.type).then(function(option){
				return AppMgr.promisedCallFunction("/addPayment",{
					purchase_id: purch.id,
					quantity : option.quantity,
					cost : option.price
				});
			}).then(function(data){
				return PurchaseDlg.displayPaymentPage(purch.id);
			}).then(function(result){
				self.refreshMyElementBinding();
				self.showToast(self.geti18n('genericSuccess'));
			}).catch(function(err){
				console.log(err);
			});
		},
		
		createWorkout:function(){
			var purch=this.getView().getBindingContext("odata").getObject();
			if (purch.state=='I') return this.showToast('purchaseCreateWorkoutInactiveState');
			var self=this;
			WorkoutDlg.createWorkoutParams(this.getView(),purch.id).then(function(workoutPars){
				return AppMgr.promisedCallFunction("/createWorkout",workoutPars);
			}).then(function(data){
				self.refreshMyElementBinding();
			}).catch(function(err){
				console.log(err);
			});
		},
		
		goToWorkout:function(e){
			var id=e.getSource().getBindingContext("odata").getProperty("id");
			this.getRouter().navTo("workout",{id:id});
		},
		
		goToGym:function(){
			var id=this.getView().getBindingContext("odata").getProperty("gym_id");
			this.getRouter().navTo("gym",{id:id});			
		},		
		
		sendMessage:function(){
			var msg=this.getView().getModel().getProperty('/chatMessage');
			var purch=this.getView().getBindingContext("odata").getObject();
			AppMgr.promisedCallFunction("/createChatMessage",{
				channelId:purch.chatChannel_channelId, text:encodeURI(msg)
			}).then(function(data){
				this.getView().getModel().setProperty('/chatMessage',"");
				this.refreshMyElementBinding();
			}.bind(this)).catch(function(err){
				console.log(err);
			});
		},
		
		decodeText:function(txt){
			return decodeURI(txt);
		},
		
		prepareMessageAuthors:function(data){
			this.messageAuthors={};
			this.messageAuthors[data.coach.id]=data.coach.nickName;
			this.messageAuthors[data.owner.id]=data.owner.nickName;
		},
				
		formatAuthor:function(id){
			return this.messageAuthors&&this.messageAuthors[id]||id;
		}
		
	});
});
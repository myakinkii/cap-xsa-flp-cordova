sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"ru/fitrepublic/shared/model/purchaseDialog"
], function (Controller, AppMgr, PurchaseDlg) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Gym", {
		
		onInit: function() {
			this.getRouter().getRoute("gym").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var id=e.getParameter("arguments").id;
			var path="/Gyms(guid'"+id+"')";
			this.getView().bindElement({ path:path, model: "odata", parameters: { expand: "coaches,coaches/coach" } });
		},
		
		selectCoach:function(e){
			var ctxs=e.getSource().getSelectedContexts();
			if (ctxs[0]) this.coach=ctxs[0].getObject();
		},
		
		makePurchase:function(){
			if (!this.coach) return this.showToast(this.geti18n('purchaseCoachNotSelected'));
			var gym_id=this.getView().getBindingContext("odata").getProperty("id");
			var purchaseType=this.getView().getBindingContext("odata").getProperty("type");
			var coach_id=this.coach.coach_id;
			var self=this;
			PurchaseDlg.displayPurchaseOptions(this.getView(),purchaseType).then(function(option){
				return AppMgr.promisedCallFunction("/makePurchase",{
					coach_id : coach_id,
					gym_id: gym_id,
					purchaseType: purchaseType,
					quantity : option.quantity,
					cost : option.price
				});
			}).then(function(data){
				return PurchaseDlg.displayPaymentPage(data.value);
			}).then(function(result){
				self.getRouter().navTo("purchase",{id:result.id});
			}).catch(function(err){
				console.log(err);
			});
		},
		
		goToCoach:function(e){
			var id=e.getSource().getBindingContext("odata").getProperty("coach_id");
			this.getRouter().navTo("coach",{id:id});
		}
		
	});
});
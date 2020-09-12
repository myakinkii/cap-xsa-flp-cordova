sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"ru/fitrepublic/shared/model/purchaseDialog",
	"sap/m/GroupHeaderListItem"
], function (Controller, AppMgr, PurchaseDlg, GroupHeaderListItem) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Coach", {
		
		onInit: function() {
			this.getRouter().getRoute("coach").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var id=e.getParameter("arguments").id;
			var path="/Coaches(guid'"+id+"')";
			this.getView().bindElement({ path:path, model: "odata", parameters: { expand: "gyms,gyms/gym" } });
		},
		
		getGroupHeader:function(oGroup){
			return new GroupHeaderListItem({
				title: this.geti18n('gymType_'+oGroup.key),
				type:'Inactive',
				upperCase: false
			});
		},
		
		selectGym:function(e){
			var ctxs=e.getSource().getSelectedContexts();
			if (ctxs[0]) this.gym={ gym_id:ctxs[0].getProperty("gym_id"),gym_type:ctxs[0].getProperty("gym/type") };
		},
		
		makePurchase:function(){
			if (!this.gym) return this.showToast(this.geti18n('purchaseGymNotSelected'));
			var coach_id=this.getView().getBindingContext("odata").getProperty("id");
			var purchaseType=this.gym.gym_type;
			var gym_id=this.gym.gym_id;
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
		
		goToGym:function(e){
			var id=e.getSource().getBindingContext("odata").getProperty("gym_id");
			this.getRouter().navTo("gym",{id:id});
		},
		
		contentPress:function(e){
			this.displayContent(e.getSource().getBindingContext("odata").getProperty("url"));
		}
		
	});
});
sap.ui.define(["ru/fitrepublic/shared/model/appMgr", "sap/ui/model/json/JSONModel" ], function(AppMgr, JSONModel) {
	"use strict";
	
	var extResolve, extReject;

	return {
		
		createWorkoutParams:function(view, purchId){
			var self=this;
			if (!this.workoutDialog) {
				this.workoutDialog = sap.ui.xmlfragment("ru.fitrepublic.shared.fragments.AddWorkoutDialog", this);
				view.addDependent(this.workoutDialog);
				this.workoutDialog.setModel(new JSONModel({
					timestamp:new Date(),
					time:"12:00",
					selectedPurchase:purchId,
					showPurchases:!purchId
				}));
			}
			return new Promise(function(resolve,reject){
				extResolve=resolve;
				extReject=reject;
				self.workoutDialog.open();
			});
		},
		
		handleCalendarSelect:function(e){
			var date=e.getSource().getSelectedDates()[0].getStartDate();
			this.workoutDialog.getModel().setProperty('/timestamp',date);
		},
		
		confirmDate:function(e){
			var mdlData=this.workoutDialog.getModel().getData();
			if (!mdlData.selectedPurchase) return extReject({errCode:'NO_PURCHASE'});
			var date=mdlData.timestamp;
			var hour=mdlData.time.split(":")[0];
			date.setMinutes(0);
			date.setSeconds(0);
			var ts=date.setHours(hour);
			this.workoutDialog.close();
			extResolve({purchase_id:mdlData.selectedPurchase, timestamp:date });
		},
		
		closeDlg:function(e){
			this.workoutDialog.close();
			extReject(null);
		}		
	};
});
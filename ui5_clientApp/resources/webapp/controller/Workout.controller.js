sap.ui.define([ "ru/fitrepublic/shared/model/WorkoutController", "ru/fitrepublic/shared/model/appMgr",
	"ru/fitrepublic/shared/model/excerciseDialog"
], function (Controller, AppMgr, ExcerciseDlg) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Workout", {
		
		onInit: function() {
			this.getRouter().getRoute("workout").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var id=e.getParameter("arguments").id;
			var path="/Workouts(guid'"+id+"')";
			this.getView().byId("objectPageLayout").setSelectedSection(this.getView().byId("planSection"));
			this.getView().bindElement({ path:path, model: "odata", parameters: { expand: "purchase,purchase/gym,coach,client" } });
		},
		
		isEditable:function(){
			var path=this.getView().getBindingContext("odata").getPath();
			var purchType=this.getView().getModel("odata").getProperty(path+'/purchase/type',true);
			var status=this.getView().getModel("odata").getProperty(path+'/status');
			return purchType=='O' && status=='S';
		},
		
		editExReport:function(e){
			if (!this.isEditable()) return this.showToast(this.geti18n('workoutNotEditable'));
			var path=e.getSource().getBindingContext("odata").getPath();
			var items=this.getItemsBindingFor("excercisesListReport");
			ExcerciseDlg.editReportDialog(this.getView(),path).then(function(re){
				items.refresh(true);
			}).catch(function(err){
				console.log(err);
			});
		},
		
		finalizeWorkout:function(){
			var ctx=this.getView().getBindingContext("odata");
			var self=this;
			AppMgr.promisedUpdate(ctx.getPath(),{status:'E'}).then(function(re){
				self.showToast(self.geti18n('genericSuccess'));
				self.refreshMyElementBinding();
			}.bind(this)).catch(function(err){
				self.handleError(err);
			});	
		}

	});
});
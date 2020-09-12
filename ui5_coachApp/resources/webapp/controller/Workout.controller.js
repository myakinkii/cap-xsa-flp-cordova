sap.ui.define([ "ru/fitrepublic/shared/model/WorkoutController", "ru/fitrepublic/shared/model/appMgr",
	"ru/fitrepublic/shared/model/addContentDialog",
	"ru/fitrepublic/shared/model/excerciseDialog"
], function (Controller, AppMgr, AddContentDlg, ExcerciseDlg) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_coachApp.controller.Training", {
		
		onInit: function() {
			this.getRouter().getRoute("workout").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var id=e.getParameter("arguments").id;
			var path="/Workouts(guid'"+id+"')";
			this.getView().byId("objectPageLayout").setSelectedSection(this.getView().byId("planSection"));
			this.getView().bindElement({ path:path, model: "odata", parameters: { expand: "purchase,purchase/gym,coach,client" } });
		},

		addContent:function(e){
			var workout_id=this.getView().getBindingContext("odata").getProperty("id");
			var items=this.getItemsBindingFor("contentList");
			var length=1; // start with 1
			if (items.getLength()){
				var ctxs=items.getContexts();
				length=ctxs[ctxs.length-1].getProperty("pos")+1;
			}
			AddContentDlg.showContentDialog(this.getView()).then(function(content){
				return Promise.all(content.map(function(c,i){
					return AppMgr.promisedCreate("/WorkoutsToContent", { workout_id:workout_id,content_id:c.id, pos:i+length });
				}));
			}).then(function(all){
				items.refresh(true);
			}).catch(function(err){
				console.log(err);
			});
		},
		
		deleteContent:function(e){
			var items=this.getItemsBindingFor("contentList");
			var path = e.getParameter("listItem").getBindingContext("odata").getPath();
			AppMgr.promisedDelete(path).then(function(){
				items.refresh(true);
			});
		},
		
		addExcercisePlan:function(){
			var workout_id=this.getView().getBindingContext("odata").getProperty("id");
			var items=this.getItemsBindingFor("excercisesListPlan");
			var view=this.getView();
			AddContentDlg.showContentDialog(view).then(function(content){
				return ExcerciseDlg.createExcercisePlan(view, items.getLength(), content.map(function(c){
					return { workout_id:workout_id, video_id:c.id, name:c.title };
				}));
			}).then(function(all){
				items.refresh(true);
			}).catch(function(err){
				console.log(err);
			});			
		},

		addExcerciseReport:function(){
			var workout_id=this.getView().getBindingContext("odata").getProperty("id");
			var items=this.getItemsBindingFor("excercisesListReport");
			ExcerciseDlg.createExcerciseReport(this.getView(), items.getLength(), [{workout_id:workout_id} ]).then(function(all){
				items.refresh(true);
			}).catch(function(err){
				console.log(err);
			});
		},		
		
		deleteExcercisePlan:function(e){
			if (!this.isEditable()) return this.showToast(this.geti18n('workoutNotEditable'));
			var items=this.getItemsBindingFor("excercisesListPlan");
			var path = e.getParameter("listItem").getBindingContext("odata").getPath();
			AppMgr.promisedDelete(path).then(function(){
				items.refresh(true);
			});
		},
		
		deleteExcerciseReport:function(e){
			if (!this.isEditable()) return this.showToast(this.geti18n('workoutNotEditable'));
			var items=this.getItemsBindingFor("excercisesListReport");
			var path = e.getParameter("listItem").getBindingContext("odata").getPath();
			AppMgr.promisedDelete(path).then(function(){
				items.refresh(true);
			});
		},
		
		isEditable:function(){
			var path=this.getView().getBindingContext("odata").getPath();
			var status=this.getView().getModel("odata").getProperty(path+'/status');
			return status=='S';
		},
		
		editExPlan:function(e){
			if (!this.isEditable()) return this.showToast(this.geti18n('workoutNotEditable'));
			var path=e.getSource().getBindingContext("odata").getPath();
			var items=this.getItemsBindingFor("excercisesListPlan");
			ExcerciseDlg.editPlanDialog(this.getView(),path).then(function(re){
				items.refresh(true);
			}).catch(function(err){
				console.log(err);
			});
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
		}
		
	});
});
sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/m/GroupHeaderListItem"
], function (Controller, AppMgr, GroupHeaderListItem) {
	"use strict";

	return Controller.extend("ru.fitrepublic.shared.model.WorkoutController", {

		formatWorkoutStatus:function(statusCode){
			return this.geti18n('workoutStatus_'+statusCode);
		},
		
		getExGroup:function(ctx){
			var obj=ctx.getObject();
			return [obj.setNum, obj.setNum>0?0:obj.exNum, obj.repeat].join("_");
		},
		
		getExGroupHeader:function(oGroup){
			var vals=oGroup.key.split("_");
			var what = vals[0]>0 ? this.geti18n('workoutExCombo',[vals[0]]):this.geti18n('workoutExNum',[vals[1]]);
			var repeatWhat = this.geti18n('workoutExRepeat',[vals[2],what]);
			return new GroupHeaderListItem({
				title: repeatWhat,
				type:'Inactive',
				upperCase: false
			});
		},
		
		formatVideoIcon:function(id){
			return "sap-icon://"+(id?"video":"message-error");
		},
		
		goToPurchase:function(){
			var id=this.getView().getBindingContext("odata").getProperty("purchase_id");
			this.getRouter().navTo("purchase",{id:id});			
		},
		
		updateWorkout:function(field){
			var ctx=this.getView().getBindingContext("odata");
			var data={};
			data[field]=ctx.getProperty(field);
			var self=this;
			AppMgr.promisedUpdate(ctx.getPath(),data).then(function(re){
				self.showToast(self.geti18n('genericSuccess'));
			}.bind(this)).catch(function(err){
				self.handleError(err);
			});			
		},
		
		handleError:function(err){
			console.log(err);
		},
		
		submitPlan:function(e){
			this.updateWorkout('plan_text');
		},
		
		submitReport:function(e){
			this.updateWorkout('report_text');
		},
		
		changeRating:function(){
			this.updateWorkout('rating');
		},
		
		submitComment:function(e){
			this.updateWorkout('comment_text');
		},		

		contentPress:function(e){
			this.displayContent(e.getSource().getBindingContext("odata").getProperty("content/url"));
		},
		
		contentPressEx:function(e){
			var url=e.getSource().getBindingContext("odata").getProperty("video/url");
			if (url) this.displayContent(url);
		}
		
	});
});
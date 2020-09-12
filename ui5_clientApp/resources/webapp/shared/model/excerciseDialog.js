sap.ui.define(["ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel","sap/ui/core/message/Message"
], function(AppMgr, JSONModel, Message) {
	"use strict";
	
	var extResolve, extReject, promiseAll;

	return {
		
		createExcercisePlan:function(view,exIndex,obj){
			return this.addObjects(view,exIndex,obj, "ru.fitrepublic.shared.fragments.ExcercisePlanForm");
		},
		
		createExcerciseReport:function(view,exIndex,obj){
			return this.addObjects(view,exIndex,obj, "ru.fitrepublic.shared.fragments.ExcerciseReportForm");
		},		
		
		addObjects:function(view,exIndex,obj,fragm){
			var odataMdl=AppMgr.getOdataModel();
			var dlg = sap.ui.xmlfragment("ru.fitrepublic.shared.fragments.ExcercisesCreateDialog", this);
			view.addDependent(dlg);
			dlg.setModel(odataMdl,"odata");
			dlg.attachAfterClose(function(){ dlg.destroy(); });
			var car=sap.ui.getCore().byId("carousel");
			// sap.ui.getCore().getMessageManager().registerObject(dlg, true);
			this.dlg=dlg;
			var self=this;
			promiseAll=obj.map(function(ex,i){
				ex.exNum=i+exIndex+1;
				ex.setNum=0;
				ex.repeat=3;
				var form = sap.ui.xmlfragment(fragm, self);
				return new Promise(function(resolve,reject){
					var ctx=odataMdl.createEntry("/Excercises",{ properties:ex, success:resolve, error:reject});
					form.setBindingContext(ctx,"odata");
					car.addPage(form);
				});
			});
			return new Promise(function(resolve,reject){
				extResolve=resolve;
				extReject=reject;
				dlg.open();
			});
		},
		
		closeDlg:function(e){
			this.dlg.close();
			AppMgr.getOdataModel().resetChanges();
			extReject(false);
		},
		
		saveExcercises:function(e){
			if (!this.validateForm()) return;
			AppMgr.getOdataModel().submitChanges();
			this.dlg.close();
			Promise.all(promiseAll).then(extResolve).catch(extReject);
		},
		
		editPlanDialog:function(view,path){
			return this.showEditDialog(view,path,"ru.fitrepublic.shared.fragments.ExcercisePlanDialog");
		},
		
		editReportDialog:function(view,path){
			return this.showEditDialog(view,path,"ru.fitrepublic.shared.fragments.ExcerciseReportDialog");
		},
		
		showEditDialog:function(view,path,fragment){
			var odataMdl=AppMgr.getOdataModel();
			var dlg = sap.ui.xmlfragment(fragment, this);
			view.addDependent(dlg);
			dlg.setModel(odataMdl,"odata");
			dlg.attachAfterClose(function(){ dlg.destroy(); });
			dlg.bindElement({ path:path, model: "odata", parameters: {  } });
			this.dlg=dlg;
			return new Promise(function(resolve,reject){
				extResolve=resolve;
				extReject=reject;
				dlg.open();
			});
		},
		
		validateForm:function(e){
			return sap.ui.getCore().byFieldGroupId("required").reduce(function(flag, control){
				var state="None";
				try {
					control.getBinding("value").getType().validateValue(control.getValue());
				} catch(e){
					control.setValueStateText(e.message);
					state="Error";
					flag=false;
				}
				control.setValueState(state);
				return flag;
			},true);
		},		
		
		submitChanges:function(){
			if (!this.validateForm()) return;
			this.dlg.close();
			var odataMdl=AppMgr.getOdataModel();
			odataMdl.setUseBatch(true); // otherwise submitChanges callback is not called
			odataMdl.submitChanges({
				success:function(re){
					odataMdl.setUseBatch(false);
					extResolve(re);
				},
				error:function(err){
					odataMdl.setUseBatch(false);
					extReject(err);
				}
			});
		}
		
	};
});
sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	"ru/fitrepublic/shared/model/scheduleDialog"
], function (Controller, AppMgr, JSONModel, ScheduleDlg) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_coachApp.controller.Schedule", {
		
		onInit: function() {
			this.getRouter().getRoute("schedule").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(){
			AppMgr.getCalendar().then(function(data){
				this.getView().setModel(new JSONModel(this.processCalendar(data)));
			}.bind(this)).catch(function(err){
				console.log(err);
			});
		},	
		
		processCalendar:function(data){
			var fm=AppMgr.getCalendarFormatters();
			var calendar={
				startDate:new Date(),
				appointments:data.items.map(function(w){
					var start=new Date(w.timestamp);
					var end=new Date(w.timestamp);
					end.setHours(start.getHours()+w.durationHrs);
					return {
						"startDate": start,
						"endDate": end,
						"id": w.id,
						"text":fm.toTitle(w.status,w.purchase.type),
						"title":fm.toText(w.status, w.client && w.client.clientName, w.coach && w.coach.coachName, w.purchase.gym.gymName),
						"type":fm.toType(w.status,w.purchase.type),
						"icon":fm.toIcon(w.status,w.purchase.type)
					};
				})
			};
			return calendar;
		},
		
		addItem:function(e){
			console.log('add');
		},
		
		selectItem:function(e){
			var src=e.getParameter("appointment"); // can be empty cell
			if (src) {
				ScheduleDlg.showItemDialog(this.getView(), src.getBindingContext().getProperty("id")).then(function(re){
					return AppMgr.getCalendar();
				}).then(function(data){
					this.getView().getModel().setData(this.processCalendar(data));
				}.bind(this)).catch(function(err){
					console.log(err);
				});
			}
		}

	});
});

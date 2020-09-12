sap.ui.define([ "sap/ui/integration/Extension", "ru/fitrepublic/shared/model/appMgr" ], function (Extension, AppMgr) {
	"use strict";


	var oExtension = new Extension({
		formatters:AppMgr.getCalendarFormatters(),
		actions:[{
			type: "Custom",
			enabled: function(){ return AppMgr.getOnlineMode(); },
			parameters :{ "dst":"refresh"},
			icon: "sap-icon://refresh",
			text: AppMgr.geti18n("genericRefresh")
		}]
	});
	
	oExtension.getData = function () {
		var self=this;
		return AppMgr.getCalendar().then(function(calendar){
			calendar.currDate=new Date();
			calendar.legendItems=[];
			// for (var i in itemTypes) calendar.legendItems.push({
			// 	"category": itemTypes[i].legend,
			// 	"type": itemTypes[i].dayType,
			// 	"text": itemTypes[i].title
			// });
			calendar.specialDates=[];			
			calendar.items=calendar.items.map(function(w){
				var start=new Date(w.timestamp);
				var end=new Date(w.timestamp);
				end.setHours(start.getHours()+w.durationHrs);
				calendar.specialDates.push({
					"start": start.toISOString().split("T")[0], // the whole day in yyyy-mm-dd format
					"end": end.toISOString().split("T")[0], // the whole day in yyyy-mm-dd format
					"type": 'Type01' // yellow mark
					// "type":self.getFormatters().toType(w.status, w.purchase.type)
				});
				return {
					"start": start.toJSON(),
					"end": end.toJSON(),
					"id": w.id,
					"client":w.client && w.client.clientName,
					"coach": w.coach && w.coach.coachName,
					"itemStatus": w.status,
					"purchaseType":w.purchase.type,
					"gym": w.purchase.gym.gymName,
					"visualization": w.status=='U' ? "blocker": "appointment" // card expects this to be explicitly set before rendering
				};
			});
			// calendar.items.push({
			// 	"start": "2020-08-06T12:00",
			// 	"end": "2020-08-06T15:00",
			// 	"itemStatus":"U",
			// 	"visualization": "blocker"
			// });
			return Promise.resolve(calendar);
		}).then(function(data){ // add some dirty hacks to fire navigation actions to workouts and set properties to calendar
			var card=sap.ui.getCore().byId("calendarCard"); // unfortunatelly Extension.getCard() returns CardFacade instead of "real" Card
			var magicTable=card.mAggregations._content.mAggregations._content.mAggregations.table; // this is some "container" for all our stuff
			var calendarDates=magicTable.getInfoToolbar().getContent()[1]; // descendant of sap.ui.unified.calendar.Month
			calendarDates.setShowWeekNumbers(false); // and this stuff works fine
			// calendarDates.setFirstDayOfWeek(1); // but this is officially ".. not supported in sap.ui.unified.calendar.DatesRow control"
			magicTable.getItems()[0].getCells()[1].attachSelect(function(e){
				var calRow=e.getSource() // source is descendant of sap.ui.unified.CalendarRow
				var domRefId=e.getParameter("domRefId"); // maybe there's a better way to identity an appointment
				var ctx=calRow.getAppointments().reduce(function(prev,cur){ 
					if (cur.getId()==domRefId) prev=cur.getBindingContext().getObject(); // but we just compare the dom ref ids
					return prev;
				},null);
				card.fireAction({ parameters:{ dst:'workout', vars:{id:ctx.id} } }); // fire the action with proper dst
			});
			return Promise.resolve(data);
		});
	};

	return oExtension;
});
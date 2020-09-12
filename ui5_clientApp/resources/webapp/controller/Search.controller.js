sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	'sap/m/GroupHeaderListItem'
], function (Controller, AppMgr, JSONModel, GroupHeaderListItem) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.Search", {
		onInit: function() {
			this.getRouter().getRoute("search").attachMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched:function(e){
			var q=e.getParameter("arguments").q;
			var p=this.getView().getModel("profile").getData();
			AppMgr.getSearchResults(q,p.deviceId,p.authToken).then(function(data){
				data.query=q;
				this.getView().setModel(new JSONModel(data),"search");
			}.bind(this));
		},
		
		getGroupHeaderResults:function(oGroup){
			var mdlData=this.getView().getModel("search").getData();
			return new GroupHeaderListItem({
				title: this.geti18n('searchObject_'+oGroup.key),
				count:mdlData[oGroup.key],
				type:'Inactive',
				upperCase: false
			});
		},
		
		getGroupHeaderGyms:function(oGroup){
			return new GroupHeaderListItem({
				title: this.geti18n('gymType_'+oGroup.key),
				type:'Inactive',
				upperCase: false
			});
		},		
		
		formatTitle:function(title,objectType,attr){
			if (objectType=='purchase') return this.geti18n('purchaseQuantity_'+attr)+": "+title;
			if (objectType=='content') return this.geti18n('contentType_'+attr)+": '"+title+"'";
			return title;
		},
		
		goToResultObject:function(e){
			var ctx=e.getSource().getBindingContext("search").getObject();
			if (ctx.objectType=='content') this.displayContent(ctx.url);
			else this.getRouter().navTo(ctx.objectType,{id:ctx.id});
		},
		
		goToGym:function(e){
			var id=e.getSource().getBindingContext("odata").getProperty("id");
			this.getRouter().navTo("gym",{id:id});
		},
		
		goToCoach:function(e){
			var id=e.getSource().getBindingContext("odata").getProperty("id");
			this.getRouter().navTo("coach",{id:id});
		}		
		
	});
});
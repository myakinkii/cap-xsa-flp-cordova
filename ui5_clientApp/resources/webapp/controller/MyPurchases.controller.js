sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/GroupHeaderListItem"
], function (Controller, AppMgr, JSONModel, Filter, GroupHeaderListItem) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_clientApp.controller.MyPurchases", {
		
		onInit: function() {
			this.getRouter().getRoute("purchases").attachMatched(this.onRouteMatched, this);
			this.getView().setModel(new JSONModel({
				filters:[{
					key:'state', title:this.geti18n('purchaseState'),
					values:[
						{ key:'I', text:this.geti18n('purchaseState_I') },
						{ key:'A', text:this.geti18n('purchaseState_A') },
						{ key:'E', text:this.geti18n('purchaseState_E') },
						{ key:'S', text:this.geti18n('purchaseState_S') }
					]
				},{
					key:'type', title:this.geti18n('purchaseType'),
					values:[
						{ key:'R', text:this.geti18n('purchaseType_R') },
						{ key:'O', text:this.geti18n('purchaseType_O') }
					]
				}]
			}));
		},
		
		onRouteMatched:function(e){
			this.getItemsBindingFor('purchasesList').refresh(true);
		},
		
		formatState:function(stateCode){
			return this.geti18n('purchaseState')+': '+this.geti18n('purchaseState_'+stateCode);
		},
		
		formatType:function(typeCode){
			return this.geti18n('purchaseType')+': '+this.geti18n('purchaseType_'+typeCode);
		},
		
		formatUnit:function(pType){
			return this.geti18n('purchaseQuantity_'+pType);
		},
		
		confirmFilters:function(e){
			var filters=[];
			var lists = e.getSource().getLists().filter(function(l) { return l.getSelectedItems().length; });
			if (lists.length) {
				filters = new Filter(lists.map(function(l) {
					return new Filter(l.getSelectedItems().map(function(i) {
						return new Filter(l.getKey(), "EQ", i.getKey());
					}), false);
				}), true);
			}
			this.getItemsBindingFor('purchasesList').filter(filters);
		},
		
		resetFilters:function(e){
			e.getSource().getLists().forEach(function(l){ l.setSelectedKeys(); });
			this.getItemsBindingFor('purchasesList').filter([]);
		},
		
		getGroupHeader:function(oGroup){
			return new GroupHeaderListItem({
				title: oGroup.key,
				type:'Inactive',
				upperCase: false
			});
		},
		
		goToPurchase:function(e){
			var ctx=e.getSource().getBindingContext("odata").getObject();
			this.getRouter().navTo('purchase',{id:ctx.id});
		}	
		
	});
});
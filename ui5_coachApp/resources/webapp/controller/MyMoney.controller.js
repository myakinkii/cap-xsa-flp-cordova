sap.ui.define([ "ru/fitrepublic/shared/model/BaseController", "ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/GroupHeaderListItem"
], function (Controller, AppMgr, JSONModel, Filter, GroupHeaderListItem) {
	"use strict";

	return Controller.extend("ru.fitrepublic.ui5_coachApp.controller.MyMoney", {
		
		onInit: function() {
			this.getRouter().getRoute("money").attachMatched(this.onRouteMatched, this);
			this.getView().setModel(new JSONModel({
				filters:[{
					key:'state', title:this.geti18n('billingState'),
					values:[
						{ key:'P', text:this.geti18n('billingState_P') },
						{ key:'D', text:this.geti18n('billingState_D') },
						{ key:'C', text:this.geti18n('billingState_C') },
						{ key:'R', text:this.geti18n('billingState_R') }
					]
				},{
					key:'purchase/type', title:this.geti18n('purchaseType'),
					values:[
						{ key:'R', text:this.geti18n('purchaseType_R') },
						{ key:'O', text:this.geti18n('purchaseType_O') }
					]
				}]
			}));
		},
		
		onRouteMatched:function(e){
			this.getItemsBindingFor('moneyList').refresh(true);
		},

		formatState:function(stateCode){
			return this.geti18n('billingState')+': '+this.geti18n('billingState_'+stateCode);
		},
		
		formatType:function(typeCode){
			return this.geti18n('purchaseType')+': '+this.geti18n('purchaseType_'+typeCode);
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
			this.getItemsBindingFor('moneyList').filter(filters);
		},
		
		resetFilters:function(e){
			e.getSource().getLists().forEach(function(l){ l.setSelectedKeys(); });
			this.getItemsBindingFor('moneyList').filter([]);
		},
		
		getGroupHeader:function(oGroup){
			return new GroupHeaderListItem({
				title: this.geti18n('purchaseOwner',[oGroup.key]),
				type:'Inactive',
				upperCase: false
			});
		},
		
		goToPurchase:function(e){
			var ctx=e.getSource().getBindingContext("odata").getObject();
			this.getRouter().navTo('purchase',{id:ctx.purchase_id});
		}	
		
	});
});
sap.ui.define(["ru/fitrepublic/shared/model/appMgr", "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter", "sap/ui/model/FilterOperator"
], function(AppMgr, JSONModel, Filter, FilterOperator) {
	"use strict";
	
	var extResolve, extReject;

	return {
		
		showContentDialog:function(view){
			if (!this.dlg) {
				this.dlg = sap.ui.xmlfragment("ru.fitrepublic.shared.fragments.ContentSelectDialog", this);
				view.addDependent(this.dlg);
				this.dlg.setModel(AppMgr.getOdataModel(),"odata");
			}
			var self=this;
			return new Promise(function(resolve,reject){
				extResolve=resolve;
				extReject=reject;
				self.dlg.open();
			});
		},
		
		handleCancel:function(e){
			extReject(null);
		},
		
		handleSearchContent: function (e) {
			var val = e.getParameter("value");
			var filter = new Filter({
				path:"title", 
				operator:FilterOperator.Contains, 
				value1:val,
				caseSensitive:false
			});
			e.getSource().getBinding("items").filter([filter]);
		},
		
		handleAddContent:function(e){
			e.getSource().getBinding("items").filter([]);
			var ctxs = e.getParameter("selectedContexts");
			if (ctxs && ctxs.length) extResolve(ctxs.map(function(c){ return c.getObject(); }));
			else extReject(null);
		}
	};
});
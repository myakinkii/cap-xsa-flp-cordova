sap.ui.define(["ru/fitrepublic/shared/model/appMgr", "sap/ui/model/json/JSONModel" ], function(AppMgr, JSONModel) {
	"use strict";
	
	// var extResolve, extReject;

	return {
		
		displayPurchaseOptions:function(view,pType){
			
			var dlg=sap.ui.xmlfragment("ru.fitrepublic.shared.fragments.PurchaseDialog", this);
			dlg.setTitle(AppMgr.geti18n("purchaseDlgTitle_"+pType));
			dlg.attachAfterClose(function(){ dlg.destroy(); });
			view.addDependent(dlg);
			
			return AppMgr.getPurchaseOptions(pType).then(function(data){
				var opts=data.options.map(function(o){
						return {
							title:AppMgr.geti18n('purchaseOptionsTitle_'+pType+o.q, [o.q, o.p]),
							description:AppMgr.geti18n('purchaseOptionsDiscount_'+pType+o.q, [o.d]),
							price:o.p,
							quantity:o.q,
							selected:false
						};
					});
				opts[0].selected=true;
				dlg.setModel(new JSONModel({
					purchaseDescription:AppMgr.geti18n('purchaseDlgDescription_'+pType),
					options:opts
				}));
				return new Promise(function(resolve,reject){
					dlg.getBeginButton().attachPress(function(){
						var selected=dlg.getModel().getProperty("/options").filter(function(o){ return o.selected; });
						dlg.close();
						if (selected[0]) resolve(selected[0]);
						else reject();
					});
					dlg.getEndButton().attachPress(function(){
						dlg.close();
						reject();
					});
					dlg.open();
					// extResolve=resolve;
					// extReject=reject;
					// self.purchaseDialog.open();
				});
			});
		},

		// confirmPurchase:function(e){
		// 	var option=e.getParameter("selectedItem").getBindingContext().getObject();
		// 	extResolve(option);
		// },
		
		// cancelPurchase:function(){
		// 	extReject(null);
		// },
		
		displayPaymentPage:function(purchaseId){
			var result={id:purchaseId};
			var url=AppMgr.getCompletePaymentUrl(purchaseId);
			return new Promise(function(resolve,reject){
				if ( typeof cordova !== "undefined" && cordova.InAppBrowser) {
					var ref = cordova.InAppBrowser.open(url, '_blank', 'location=yes');
					ref.addEventListener('message', function(params){ result=params.data; });
					ref.addEventListener('exit', function(){ resolve(result); });
				} else {
					window.open(url, '_blank', 'location=yes');
					window.setTimeout(function(){ resolve(result); }, 1000);
				}
			});
		}
	};
});
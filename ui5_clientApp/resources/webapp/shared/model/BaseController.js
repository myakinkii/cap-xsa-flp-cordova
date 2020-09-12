sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/BusyDialog", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/core/Popup"
], function(Controller, History, BusyDialog, MessageBox, MessageToast, Popup) {
	"use strict";

	return Controller.extend("ru.fitrepublic.shared.model.BaseController", {
		
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		navBack:function(){
			history.go(-1);
		},
		
		navHome:function(){
			this.getRouter().navTo("main");
		},
		
		geti18n: function(prop, arr) {
			if (!this._i18nbndl) this._i18nbndl = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			return this._i18nbndl.getText(prop, arr);
		},
		
		showToast: function(text, time) {
			MessageToast.show(text, {
				autoClose: true,
				width: '50%',
				duration: time || 1000,
				at: Popup.Dock.CenterCenter
			});
		},

		setBusy: function(msg) {
			if (!this._busyDialog) this._busyDialog = new BusyDialog({
				title: this.geti18n('genericBusyTitle')
			});
			this._busyDialog.setText(msg || this.geti18n('genericBusyText'));
			this._busyDialog.open();
		},

		clearBusy: function(msg, time) {
			if (this._busyDialog) this._busyDialog.close();
			if (msg) this.showToast(msg, time || 500);
		},
		
		displayContent:function(url){
			if ( typeof cordova !== "undefined" && cordova.InAppBrowser) {
				var ref = cordova.InAppBrowser.open(url, '_blank', 'location=yes');
				ref.addEventListener('exit', function(){ console.log(url); });
			} else window.open(url, '_blank', 'location=yes');
		},		

		refreshMyElementBinding:function(){
			this.getView().getElementBinding("odata").refresh(true);
		},
		
		getItemsBindingFor:function(id){
			return this.getView().byId(id).getBinding("items");
		}
		
	});
	
});
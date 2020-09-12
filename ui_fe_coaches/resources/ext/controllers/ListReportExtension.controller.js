jQuery.sap.require("ru.fitrepublic.ui_fe_coaches.lib.qrcode");
sap.ui.controller("ru.fitrepublic.ui_fe_coaches.ext.controllers.ListReportExtension", {	
	
	onBeforeRebindTableExtension:function(e){
		var pars=e.getParameter("bindingParams").parameters;
		// pars.select+=',deviceId,authToken'; // I want those fields in getSelectedContexts, but not in ui
		pars.select="*"; // but '*' seem to be a little bit nicer hack
	},

	onFilerOnboarded:function(){ 
	},
	
	showQrCode:function(e){
		var btn=e.getSource();
		var data = this.extensionAPI.getSelectedContexts()[0].getObject();
		if (!this._oPopover) {
			this._oPopover = sap.ui.xmlfragment("ru.fitrepublic.ui_fe_coaches.ext.fragments.qrPopover", this);
			this.getView().addDependent(this._oPopover);
		}
		this._oPopover.openBy(btn);
		this.genQrContent(data);
	},
	
	genQrContent:function(data){
		$('#qrcode')[0].innerHTML=''; // clear div
		new QRCode("qrcode", {
			text: JSON.stringify({name:data.name, deviceId:data.deviceId,authToken:data.authToken}),
			width: 250,
			height: 250,
			colorDark: "#000000",
			colorLight: "#ffffff",
			correctLevel: QRCode.CorrectLevel.H
		});
	}

});
sap.ui.define([
	"sap/ui/model/json/JSONModel", "sap/ui/model/odata/v2/ODataModel", "sap/ui/Device",
	"sap/ui/integration/Host", "sap/ui/integration/widgets/Card", "sap/f/GridContainerItemLayoutData"
], function(JSONModel, ODataModel, Device, Host, Card, GridContainerItemLayoutData) {
	"use strict";
	
	var odataUrl, restUrl;
	var deviceId, authToken;
	var ownerComponent, i18nBndl;

	return {
		
		setModeOnline:function(onlineFlag){
			this.online=onlineFlag;
		},
		
		getOnlineMode:function(){
			return this.online;
		},
		
		setOwner:function(owner){
			ownerComponent=owner;
			i18nBndl=ownerComponent.getModel("i18n").getResourceBundle();
		},
		
		geti18n:function(prop, arr){
			return i18nBndl&&i18nBndl.getText(prop, arr);
		},
		
		resolveUrls:function(mainSvc){
			odataUrl=mainSvc.uri;
			restUrl=odataUrl.replace('odata','rest');
		},
		
		getCompletePaymentUrl:function(purchaseId){
			return restUrl+"/completePayment?device="+deviceId+"&token="+authToken+"&purchase="+purchaseId;
		},
		
		promisedGetJSON:function(url){
			return new Promise(function(resolve,reject){
				$.getJSON(url).done(resolve).fail(function(xhr,status,error){
					reject(xhr.responseJSON);
				});
			});			
		},		
		
		onboard:function(device){
			return this.promisedGetJSON(restUrl+"/onboard?device="+device);
		},
		
		onboardCoach:function(device,token){
			return this.promisedGetJSON(restUrl+"/onboard?device="+device+"&token="+token);
		},
		
		queryBackend:function(endpoint,args){
			var pars= "device="+deviceId+"&token="+authToken;
			for (var a in args) pars+= "&"+a+"="+args[a];
			var url=restUrl+endpoint+"?"+pars;
			return this.promisedGetJSON(url);
		},
		
		getOdataModel:function(){
			var odataMdl=ownerComponent.getModel("odata");
			if (!odataMdl){ // offline mode
				odataMdl={
					read:function(){ return Promise.reject(); },
					update:function(){ return Promise.reject(); },
					callFunction:function(){ return Promise.reject(); }
				};
			}
			return odataMdl;
		},
		
		promisedOdataAction:function(fn,path,payload,urlPars){
			var odataMdl=this.getOdataModel();
			var args=[path];
			if (payload) args.push(payload);
			var pars={};
			if (urlPars) pars.urlParameters=urlPars;
			args.push(pars);
			return new Promise(function(resolve,reject){
				pars.success=function(data){ resolve(data); };
				pars.error=function(err){ reject(err); };
				fn.apply(odataMdl,args);
			});
		},
		
		promisedRead:function(path,urlPars){
			return this.promisedOdataAction(this.getOdataModel().read, path, null, urlPars);
		},

		promisedCreate:function(path,payload,urlPars){
			return this.promisedOdataAction(this.getOdataModel().create, path, payload, urlPars);
		},
		
		promisedUpdate:function(path,payload,urlPars){
			return this.promisedOdataAction(this.getOdataModel().update, path, payload, urlPars);
		},
		
		promisedDelete:function(path,urlPars){
			return this.promisedOdataAction(this.getOdataModel().remove, path, null, urlPars);
		},
		
		promisedCallFunction:function(fn,urlPars){
			return this.promisedOdataAction(this.getOdataModel().callFunction, fn, null, urlPars);
		},
			
		getInitData:function(){
			return this.queryBackend("/init");
		},
		
		getSearchResults:function(query){
			return this.queryBackend("/search",{q:query});
		},
		
		getPurchaseOptions:function(purchaseType){
			return this.queryBackend("/getPurchaseOptions",{type:purchaseType});
		},
		
		getPromoData:function(){
			return this.queryBackend("/getPromoData");
		},
		
		getChatChannels:function(){
			return this.promisedOdataRead("/MyChatChannels");
		},
		
		getCalendarFormatters:function(){
		/*
			'Type01' yellow
			'Type02' orange
			'Type03' red
			'Type04' deep red/brown
			'Type05' pink
			'Type06' green
			'Type07' deep blue
			'Type08' light blue
			'Type09' light green
			'Type10' purple
		*/	
			var itemTypes={
				U:{ dayType:'Type03', icon:'appear-offline', title:this.geti18n('calendarItemU'), legend:'calendar' }, // red
				R:{ dayType:'Type08', icon:'appointment', title:this.geti18n('calendarItemR'),  legend:'appointment'}, // light blue
				O:{ dayType:'Type09', icon:'appointment', title:this.geti18n('calendarItemO'),  legend:'appointment'}, // light green
				S:{ dayType:'Type05', icon:'appointment', title:this.geti18n('calendarItemS'),  legend:'appointment'} // pink
			};
			return {
				toTitle:function(itemStatus, purchaseType){
					if (itemStatus=='U') return itemTypes[itemStatus].title;
					return itemTypes[purchaseType].title;
				},
				toText:function(itemStatus, client, coach, gym){
					if (itemStatus=='U') return '';
					return (client||coach)+' @'+gym;
				},
				toType:function(itemStatus, purchaseType){
					if (itemStatus=='U') return itemTypes[itemStatus].dayType;
					return itemTypes[purchaseType].dayType;
				},
				toIcon: function (itemStatus,purchaseType) {
					if (itemStatus=='U') return 'sap-icon://'+itemTypes[itemStatus].icon;
					return 'sap-icon://'+itemTypes[purchaseType].icon;
				},
				toViz:function(itemStatus){
					if (itemStatus=='U') return 'blocker';
					return 'appointment';
				}
			};
		},
		
		getCalendar:function(){
			if (this.online) return this.refreshCalendar();
			else return this.getLocalCalendar();
		},
		
		refreshCalendar:function(){
			return this.queryBackend("/getCalendar").then(function(data){
				this.setLocalCalendar({items:data});
				return this.getLocalCalendar();
			}.bind(this));
		},
		
		setLocalCalendar:function(calendar){
			window.localStorage.setItem('calendar',JSON.stringify(calendar));
		},
		
		getLocalCalendar:function(){
			return Promise.resolve(JSON.parse(window.localStorage.getItem('calendar')));
		},
		
		getAuthPars:function(){
			return {deviceId:deviceId, authToken:authToken};
		},
		
		init:function(component, fullProfile){
			deviceId=fullProfile.deviceId;
			authToken=fullProfile.authToken;
			return this.getInitData(deviceId,authToken).then(function(data){
				this.setProfile(data.profile);
				this.setLocalCards(data.cards);
				component.setModel(this.createProfileModel(data.profile), "profile");
				component.setModel(this.createOdataModel({url:odataUrl, deviceId:deviceId, authToken:authToken}), "odata");
				component.setModel(this.createDeviceModel(), "device");
				return Promise.resolve(data);
			}.bind(this));
		},
		
		initOffline:function(component,localProfile){
			deviceId=localProfile.deviceId;
			authToken=localProfile.authToken;
			component.setModel(this.createProfileModel(this.getProfile()), "profile");
			component.setModel(this.createOdataModel(), "odata");
			component.setModel(this.createDeviceModel(), "device");
			return Promise.resolve();
		},		
		
		resetProfile:function(){
			window.localStorage.removeItem('profile');
			window.location.reload();
		},
		
		getProfile:function(){
			var localProfile=JSON.parse(window.localStorage.getItem('profile')) || {};
			if (!localProfile.authToken){
				localProfile.authToken = '';
				localProfile.deviceId = Math.random().toString(26).slice(2);
				if (typeof device !== "undefined") localProfile.deviceId=device.uuid.toLowerCase();
			}
			return Promise.resolve(localProfile);			
		},
		
		setProfile:function(profile){
			window.localStorage.setItem('profile',JSON.stringify(profile));
		},
		
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		createProfileModel:function(profile){
			profile.isCoach = profile.name?true:false;
			profile.isUser = !profile.isCoach;
			return new JSONModel(profile);
		},
		
		createOdataModel:function(pars){
			if (!pars) return null;
			return new ODataModel({
				defaultBindingMode: "TwoWay",
				defaultCountMode: "Inline",
				defaultUpdateMethod: "PATCH",
				refreshAfterChange: false,
				useBatch:false,
				serviceUrl:pars.url,
				serviceUrlParams:{device:pars.deviceId,token:pars.authToken}
			});
		},
		
		setLocalCards:function(cards){
			window.localStorage.setItem('cards',JSON.stringify(cards));
		},
		
		getLocalCards:function(){
			return JSON.parse(window.localStorage.getItem('cards'));
		},
		
		setHiddenCards:function(cards){
			window.localStorage.setItem('hiddenCards',JSON.stringify(cards));
		},		
		
		getHiddenCards:function(){
			return JSON.parse(window.localStorage.getItem('hiddenCards')) || {};
		},
		
		cardsDstResolver:function(dst){
			if (dst=='odata_srv') return odataUrl;
			if (dst=='rest_api') return restUrl;
		},		
		
		renderCards: function(cntrl,cardContainer) {
			var self=this;
			var hiddenCards=self.getHiddenCards();
			cardContainer.destroyItems();
			self.getLocalCards().forEach(function(c){
				if (hiddenCards[c.name]) return;
				var card=new Card({
					id:c.name+"Card",
					manifest:"shared/cards/"+c.name+"/manifest.json",
					action:[function(e){
						var pars=e.getParameter("parameters");
						if (pars.dst=='refresh') {
							e.getParameter("card").refresh();
						} else if(self.getOnlineMode()) {
							if (this[c.name+"ActionHandler"]) this[c.name+"ActionHandler"](pars);
							else this.getRouter().navTo(pars.dst,pars.vars);
						} else this.showToast(this.geti18n('warningOfflineMode'));
					},cntrl]
				});
				card.setLayoutData(new GridContainerItemLayoutData({ minRows:c.rows||4, columns:c.cols||4 }));
				card.setParameters(self.getAuthPars());
				
				var actions=[];
				for (var a in c.actions){
					actions.push({
						text: self.geti18n('hostAction_'+a),
						icon: self.cardActionIcons[a],
						parameters:c.actions[a],
						type: 'Custom',
						enabled: function(){ return self.getOnlineMode(); },
						visible: true
					});
				}
				card.setHost(new Host({ actions:actions, resolveDestination: self.cardsDstResolver }));
				
				cardContainer.addItem(card);
			});
		},
		
		cardActionIcons:{
			schedule:'sap-icon://appointment',
			nextWorkout:'sap-icon://create-entry-time',
			addWorkout:'sap-icon://add-activity',
			searchSplitWorkout:'sap-icon://group'
		},
		
		getDarkTheme:function(){
			return window.localStorage.getItem('darkTheme')?true:false;
		},
		
		setDarkTheme:function(flag){
			window.localStorage.removeItem('darkTheme');
			if (flag) window.localStorage.setItem('darkTheme','X');
		}		
		
	};

});
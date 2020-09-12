sap.ui.define([ "sap/ui/core/UIComponent", "ru/fitrepublic/shared/model/appMgr",
	"ru/fitrepublic/shared/model/constants",
	"sap/m/MessageBox"
], function (UIComponent, AppMgr, Constants, MessageBox) {
	"use strict";

	return UIComponent.extend("ru.fitrepublic.ui5_clientApp.Component", {

		metadata: {
			manifest: "json"
		},

		init: function () {
			
			UIComponent.prototype.init.apply(this, arguments);
			
			var onlineMode=true; // current online state
			var onlineOnly=typeof Connection == "undefined"; // testing in web ide
			if (!onlineOnly){
				document.addEventListener("online", function(){ AppMgr.setModeOnline(true); }, false);
				document.addEventListener("offline", function(){ AppMgr.setModeOnline(false); }, false);
				onlineMode = navigator.connection && navigator.connection.type!==Connection.NONE;
			}
			
			AppMgr.setModeOnline(onlineMode);
			AppMgr.setOwner(this);
			AppMgr.resolveUrls(this.getManifestEntry("/sap.app/dataSources/mainService"));
			
			var router=this.getRouter();
			AppMgr.getProfile().then(function(localProfile){
				if (localProfile.authToken){
					this.initPromise = onlineMode ? AppMgr.init(this,localProfile) : AppMgr.initOffline(this,localProfile);
					return this.initPromise;
				} else {
					if(onlineMode){
						router.initialize(true); // to make skip it empty hash and navto to onboard without Main
						router.navTo("onboard",{id:localProfile.deviceId}); 
						return Promise.reject({errCode:'INIT_ONBOARDING',src:'FE'});
					} else {
						return Promise.reject({errCode:'INIT_ONBOARDING_OFFLINE',src:'FE'});
					}
				}
			}.bind(this)).then(function(initData){
				router.initialize(false);
			}).catch(function(err){
				if (err.errCode==Constants.errors.INIT_ONBOARDING_OFFLINE) {
					MessageBox.error(AppMgr.geti18n('errorCannotOnboardOfflie'));
				} else if (err.errCode==Constants.errors.PROFILE_NOT_FOUND) {
					var resetProfile=AppMgr.geti18n('profileReset');
					MessageBox.error(AppMgr.geti18n('errorCannotInitProfile',[resetProfile]), {
						actions: [resetProfile, MessageBox.Action.CLOSE],
						emphasizedAction: MessageBox.Action.CLOSE,
						onClose: function (action) {
							if (action==resetProfile) AppMgr.resetProfile();
						}
					});
				} else console.log(err);
			});
		}
	});
});
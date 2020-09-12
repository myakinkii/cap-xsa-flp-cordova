sap.ui.define([], function() {
	"use strict";

	return {
		errors:{
			INIT_ONBOARDING:'INIT_ONBOARDING', // fe, init done after onboarding
			INIT_ONBOARDING_OFFLINE:'INIT_ONBOARDING_OFFLINE', // fe, onboard while offline
			UNKNOWN_BACKEND_ERROR:'UNKNOWN_BACKEND_ERROR', // something went wrong on the backend side, see errObj
			NOT_ALLOWED:'NOT_ALLOWED', // not authorized to some action
			PROFILE_NOT_FOUND:'PROFILE_NOT_FOUND', // could not retrieve profile for auth data
			NOT_ENOUGH_ONBOARD_DATA:'NOT_ENOUGH_ONBOARD_DATA', // could not onboard
			ONBOARD_PROFILE_NOT_FOUND:'ONBOARD_PROFILE_NOT_FOUND', // coach onboarding profile not found
			NOT_ENOUGH_FUNDS:'NOT_ENOUGH_FUNDS' // insufficient funds to do something
		}
	};
});
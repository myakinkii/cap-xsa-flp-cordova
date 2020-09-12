const crypto = require("crypto");
const cds = require('@sap/cds')
module.exports = function (srv) {
	
	const { Coaches } = srv.entities;
	
	srv.before(['CREATE', 'UPDATE'], Coaches, req => { 
		if (!req.data.authToken) req.data.authToken=crypto.createHash('md5').update(req.data.id).digest('hex');
	});
	
	srv.after('READ', Coaches, each => {
		// if(!each.deviceId) each.deviceId='NO';
		// else each.deviceId='YES';
	});
}
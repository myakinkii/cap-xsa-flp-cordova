"use strict";

const { v1: uuidv1 } = require('uuid');
const crypto = require("crypto");

process.env.XS_APP_LOG_LEVEL = "warning";
const port = process.env.PORT || 4004;

const express = require("express");
const app = express();

const proxy = require("@sap/cds-odata-v2-adapter-proxy");
app.use(proxy({ path: "odata", port: port }));

const cds = require("@sap/cds");
const conn = cds.connect("db");

conn.then(function(){
	
	const errors={
		UNKNOWN_BACKEND_ERROR:'UNKNOWN_BACKEND_ERROR', // something went wrong
		NOT_ALLOWED:'NOT_ALLOWED', // not authorized to some action
		PROFILE_NOT_FOUND:'PROFILE_NOT_FOUND', // could not retrieve profile for auth data
		NOT_ENOUGH_ONBOARD_DATA:'NOT_ENOUGH_ONBOARD_DATA', // could not onboard
		ONBOARD_PROFILE_NOT_FOUND:'ONBOARD_PROFILE_NOT_FOUND', // coach onboarding profile not found
		GYM_NOT_FOUND:'GYM_NOT_FOUND', // could not find proper gym for a purchase
		NOT_ENOUGH_FUNDS:'NOT_ENOUGH_FUNDS' // insufficient funds to do something		
	};
	
	const server = app.listen(port);
	server.on("error", error => console.error(error.stack));
	app.get('/', (req, res) => res.send("ok"));

	function genericAuthCheck(req){
		if (req && req._ && req._.req ){
			var authToken = req._.req.query.token;
			if (!authToken) req.reject(403, {errCode: errors.NOT_ALLOWED});
		}
	}
	
	function forbidProfileCreation(req){
		if (req && req._ && req._.req) req.reject(403, {errCode: errors.NOT_ALLOWED}); // forbid "external" creation of new Profiles
	}

	function basicChecks(srv, deviceId, authToken){
		const { Profiles } = srv.entities;
		const tx = srv.transaction();
		return new Promise(function(resolve,reject){
			if (!(deviceId && authToken)) reject({errCode: errors.NOT_ALLOWED});
			else resolve();
		}).then(function(){
			return tx.read(Profiles).where({ deviceId: deviceId, authToken: authToken });
		}).then(function(profiles){
			if (profiles[0]) return Promise.resolve(profiles[0]);
			else return Promise.reject({errCode: errors.PROFILE_NOT_FOUND});
		});
	}
	
	var settings=null;
	function getSettings(srv){
		if (settings) return Promise.resolve(settings);
		else return refreshSettings(srv);
	}
	
	function refreshSettings(srv){
		const { Settings } = srv.entities;
		const tx = srv.transaction();
		const refreshInterval=1000*60*3;
		return tx.read(Settings).orderBy('l1,l2,prop').then(function(settingsData){
			settings=settingsData.reduce(function(prev,cur){
				if (!prev[cur["l1"]]) prev[cur["l1"]]={};
				if (!prev[cur["l1"]][cur["l2"]]) prev[cur["l1"]][cur["l2"]]={};
				prev[cur["l1"]][cur["l2"]][cur["prop"]]=cur["VAL"]; // wtf uppercase
				return prev;
			},{});
			setTimeout(function(){ refreshSettings(srv); },refreshInterval);
			return Promise.resolve(settings);
		});			
	}
	
	function getCards(space,profile,actionFns,srv){
		var cards={};
		return getSettings(srv).then(function(settings){
			var promises=[], c, cardName, cardSett, card;
			for (c in settings[space]["cards"]){
				cardName=settings[space]["cards"][c];
				card={ name:cardName };
				if (settings[space][cardName]) {
					cardSett=settings[space][cardName];
					if (cardSett["hidden"]) continue;
					if (cardSett["rows"]) card.rows=parseInt(cardSett["rows"]);
					if (cardSett["cols"]) card.rows=parseInt(cardSett["cols"]);
				}
				if (actionFns[cardName]) promises.push(actionFns[cardName](profile,srv));
				cards[cardName]=card;
			}
			if (promises.length) return Promise.all(promises)
			else return Promise.resolve([]);
		}).then(function(actions){
			if (actions.length) {
				actions.forEach(function(a){ cards[a.card].actions=a.actions; })
			}
			var cardsArr=[];
			for (var c in cards) cardsArr.push(cards[c]);
			return Promise.resolve({profile:profile, cards:cardsArr});
		});
	}	

	cds.serve("ClientService").in(app).with(function(srv){
		
		const { 
			Profiles, Coaches, Gyms, Purchases, Payments, MyActivePurchases, 
			Chats, ChatMessages, Workouts, CoachBilling, Content
		} = srv.entities;
		const baseUrl = '/rest/client';
		
		const cardActions={
			calendar:function(profile,svc){
				var actions={  'addWorkout':{ dst:'addWorkout'}  };
				const tx = svc.transaction();
				const nextWorkoutQuery=SELECT.one(Workouts).columns('id','status','timestamp').where({
					client_id:profile.id,
					status:'S',
					timestamp:{ ">": (new Date()).toJSON() }
				}).orderBy({timestamp:'asc'});
				return tx.run(nextWorkoutQuery).then(function(next){
					if (next) actions['nextWorkout']={ dst: 'workout', vars: { id: next.id } };
					return Promise.resolve({ card:'calendar', actions:actions });
				});
			}
		};
		
		app.get(baseUrl + '/onboard', function(req, res){
			var deviceId = req.query.device;
			if (!deviceId) res.status(403).send({errCode: errors.NOT_ENOUGH_ONBOARD_DATA});
			const tx = srv.transaction();
			tx.read(Profiles).where({ deviceId: deviceId }).then(function(profiles){
				if (!profiles[0]){
					const id=uuidv1();
					const entry={
						id: id,
						nickName: '',
						age:null,
						deviceId:deviceId,
						authToken:crypto.createHash('md5').update(id+deviceId).digest('hex')
					};
					return tx.create(Profiles).entries(entry);
				} else return Promise.resolve(profiles[0]);
			}).then(function(profile){
				res.send(profile);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		app.get(baseUrl + '/init', function(req, res){
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				return getCards("cardsClient",profile,cardActions,srv);
			}).then(function(initData){
				res.send(initData);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		app.get(baseUrl + '/search', function(req, res){
			const like='%'+(req.query.q||'').toLowerCase()+'%';
			const tx = srv.transaction();
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				const coaches=cds.parse.cql(
					"SELECT from Coaches { id, name, nickName }"+
					"where lower(name) like '"+like+"' or lower(nickName) like '"+like+"'"
				);
				const gyms=cds.parse.cql(
					"SELECT from Gyms { id, name, address_addressLine as addr }"+
					"where lower(name) like '"+like+"' or lower(address_addressLine) like '"+like+"'"
				);
				const purchases=cds.parse.cql(
					"SELECT from Purchases { id, state, type, quantity, coach.name as coach_name, gym.name as gym_name }"+
					"where owner.id='"+profile.id+"' and ( lower(coach.name) like '"+like+"' or lower(gym.name) like '"+like+"' )"
				);
				const content=cds.parse.cql(
					"SELECT from Content { id, title, description, contentType, url, author.name }"+
					"where lower(title) like '"+like+"' or lower(description) like '"+like+"' "
				);				
				return Promise.all([ tx.run(coaches),  tx.run(gyms),  tx.run(purchases), tx.run(content) ]);
			}).then(function(results){
				var data={ coach:0, gym:0, purchase:0, content:0, results:[] };
				[
					function(i){
						data.coach++;
						data.results.push({
							objectType:'coach', id:i.id, 
							title:i.name, intro:i.nickName
						});
					},
					function(i){
						data.gym++;
						data.results.push({
							objectType:'gym', id:i.id, 
							title:i.name, intro:i.addr
						});
					},
					function(i){
						data.purchase++;
						data.results.push({
							objectType:'purchase', id:i.id, typeAttribute:i.type,
							title:i.quantity, intro:i.coach.coach_name+' @ '+i.gym.gym_name
						});
					},
					function(i){
						data.content++;
						data.results.push({
							objectType:'content', id:i.id, typeAttribute:i.contentType,
							title:i.title, intro:i.author.name, url:i.url
						});
					}
				].map(function(fn,i){ results[i].forEach(fn); });
				res.send(JSON.stringify(data));
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		app.get(baseUrl + '/getPromoData', function(req, res){
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				const tx = srv.transaction();
				const latestCoach=SELECT.one(Coaches).columns('id','name','nickName','createdAt').where({
					createdAt:{ "<": (new Date()).toJSON() }
				}).orderBy({createdAt:'desc'});
				const latestGym=SELECT.one(Gyms).columns('id','name', 'address_addressLine as addr','createdAt').where({
					createdAt:{ "<": (new Date()).toJSON() }
				}).orderBy({createdAt:'desc'});
				return Promise.all([ tx.run(latestCoach), tx.run(latestGym) ]);
			}).then(function(res){
				const coach=res[0], gym=res[1];
				var options=[];
				if (coach){
					options.push({
						createdAt:coach.createdAt,
						text: coach.name+(coach.nickName?" ("+coach.nickName+")":""),
						image:'shared/images/promo2.jpg',
						parameters:{ dst:"promo", vars:{type:'coach', id:coach.id} }
					});
				}
				if (gym){
					options.push({
						createdAt: gym.createdAt,
						text: gym.name+" ("+gym.addr+")",
						image:'shared/images/promo2.jpg',
						parameters:{ dst:"promo", vars:{type:'gym', id:gym.id} }
					});
				}
				return Promise.resolve({options:options});
			}).then(function(promoData){
				res.send(promoData);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});		
		
		app.get(baseUrl + '/getPurchaseOptions', function(req, res){
			
			function calcOptions(purchaseType){
				var options={};
				return getSettings(srv).then(function(settings){
					var p, pTypeRef, pSet;
					for (p in settings["purchase"]["types"]){
						pTypeRef=settings["purchase"]["types"][p];
						if (settings[pTypeRef]["atts"]["type"]==purchaseType) {
							pSet=settings[pTypeRef];
							break; // found proper ref
						}
					}
					var data={
						basePrice : parseInt(pSet["atts"]["basePrice"]),
						expirtionPeriod : parseInt(pSet["atts"]["expirtionPeriod"]),
						options : []
					};
					var o, opt;
					for (o in pSet["options"]){
						opt={
							q:parseInt(pSet["options"][o]),
							d:parseInt(pSet["discounts"][o]),
						}
						opt.p = opt.q * data.basePrice * (100-opt.d)/100;
						data.options.push(opt);
					}
					return Promise.resolve(data);
				});
			}
			const purchaseType=req.query.type||'R';
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				return calcOptions(purchaseType);
			}).then(function(priceOptions){
				res.send(priceOptions);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		app.get(baseUrl + '/completePayment', function(req, res){
			const tx = srv.transaction();
			const purchaseId=req.query.purchase;
			var purch;
			return new Promise(function(resolve,reject){
				if (!purchaseId) return reject({errCode: errors.NOT_ALLOWED});
				return resolve();
			}).then(function(){
				return basicChecks(srv, req.query.device,req.query.token);
			}).then(function(profile){
				return tx.read(Purchases).where({id:purchaseId,owner_id:profile.id});
			}).then(function(purchases){
				purch=purchases[0];
				if (!purch) return Promise.reject({errCode: errors.NOT_ALLOWED});
				return tx.update(Payments,{id:purch.activePaymentId}).with({
					state:'D',
					paymentDate:(new Date()).toJSON() // not cool, but passing date obj yields an error
				});
			}).then(function(payment){
				var actions=[];
				var expDate = new Date( purch.expirationDate||Date.now() ); // can be first or additional payments
				var expDateShift;
				if (purch.type=='R') expDateShift=1000*3600*24*30; // one month
				else expDateShift=1000*3600*24*30*payment.quantity; // number of months in purchase
				expDate.setTime(expDate.getTime()+expDateShift);
				actions.push(tx.update(Purchases,{id:payment.purchase_id}).with({
					state:'A',
					expirationDate:expDate.toJSON(),
					cost: purch.cost+payment.cost,
					quantity: purch.quantity+payment.quantity
				}));
				if (purch.type=='O') actions.push(tx.create(CoachBilling).entries({
					id:uuidv1(),
					purchase_id:purch.id,
					coach_id:purch.coach_id,
					billingDate:payment.paymentDate,
					amount:payment.cost
				}));
				return Promise.all(actions);
			}).then(function(results){
				res.send(results);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});			
		
		app.get(baseUrl + '/getCalendar', function(req, res){
			const tx = srv.transaction();
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				const workoutQuery=cds.parse.cql(
					"SELECT from Workouts { "+
						"id, status, timestamp, durationHrs, purchase.type, purchase.gym.name as gymName, "+
						"coach.name as coachName "+
					"} where client.id='"+profile.id+"'"
				);
				return tx.run(workoutQuery);
			}).then(function(workouts){
				res.send(workouts);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		srv.before('CREATE', Profiles, forbidProfileCreation);
		srv.before(['READ', 'CREATE', 'UPDATE', 'DELETE'], genericAuthCheck);	
		
		srv.before('READ', MyActivePurchases, req => {
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				req.query.where({ "owner_id":{"=":profile.id } });
				return Promise.resolve(profile.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});		
		
		srv.on ('makePurchase', req => {
			const tx = srv.transaction();
			var purchase={
				id: uuidv1(),
				owner_id : null,
				coach_id : req.data.coach_id,
				gym_id: req.data.gym_id,
				chatChannel_channelId : null,
				quantity : 0,
				cost : 0,
				purchaseDate : new Date(),
				expirationDate : null,
				type : req.data.purchaseType
			};
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				purchase.owner_id=profile.id;
				const gymQuery=cds.parse.cql(
					"SELECT from CoachesToGyms { gym_id, coach_id, gym.type }"+
					"where coach.id='"+purchase.coach_id+"' and gym.id='"+purchase.gym_id+"' and gym.type='"+purchase.type+"'"
				);
				return tx.run(gymQuery); // find us a proper gym
			}).then(function(gyms){
				if (!gyms[0]) return Promise.reject({errCode: errors.GYM_NOT_FOUND});
				return tx.create(Chats).entries({channelId:uuidv1()}); // create Chat entry
			}).then(function(chatEntry){
				purchase.chatChannel_channelId=chatEntry.channelId;				
				return tx.create(Purchases).entries(purchase); // create Purchase entry
			}).then(function(result){
				return tx.create(Payments).entries({ // create Payments entry
					id:uuidv1(),
					purchase_id:result.id,
					cost:req.data.cost,
					quantity:req.data.quantity,
					remainder:req.data.cost
				});
			}).then(function(payment){
				return tx.update(Purchases,{id:purchase.id}).with({ activePaymentId:payment.id }); // assign Payment to Purchase
			}).then(function(){
				return req.reply(purchase.id); // if all goes well return initial Purchase id
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.on ('addPayment', req => {
			const tx = srv.transaction();
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				return tx.create(Payments).entries({ // create Payments entry
					id:uuidv1(),
					purchase_id:req.data.purchase_id,
					cost:req.data.cost,
					quantity:req.data.quantity,
					remainder:req.data.cost
				});
			}).then(function(payment){
				return tx.update(Purchases,{id:req.data.purchase_id}).with({ activePaymentId:payment.id }); // assign Payment to Purchase
			}).then(function(purchase){
				return req.reply(purchase.activePaymentId); // if all goes well return new activePaymentId
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});		
		
		srv.on ('createWorkout', req => {
			const tx = srv.transaction();
			// var me;
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				// me=profile;
				return tx.read(Purchases).where({id:req.data.purchase_id,owner_id:profile.id});
			}).then(function(purchases){
				const purch=purchases[0];
				if (!purch) return Promise.reject({errCode: errors.NOT_ALLOWED});
				req.data.id=uuidv1();
				req.data.coach_id=purch.coach_id;
				req.data.client_id=purch.owner_id;
				return tx.create(Workouts).entries(req.data);
			}).then(function(workout){
				return req.reply(workout.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.on ('createChatMessage', req => {
			const tx = srv.transaction();
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				const q=cds.parse.cql( 
					"SELECT from Purchases { id, owner_id } "+
					"where chatChannel.channelId='"+req.data.channelId+"' and owner.id='"+profile.id+"'"
				);
				return tx.run(q)
			}).then(function(purchases){
				if (!purchases[0])  return Promise.reject({errCode: errors.NOT_ALLOWED});
				return tx.create(ChatMessages).entries({
					id:uuidv1(),
					channel_channelId:req.data.channelId,
					message_text:req.data.text,
					message_authorId:purchases[0].owner_id,
					message_timestamp:new Date()
				});
			}).then(function(msg){
				return req.reply(msg.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.before('READ', CoachBilling, req => {
			req.reject(403,{errCode: errors.NOT_ALLOWED});
		});		
		
		srv.before('UPDATE', Workouts, req => {
			const tx = srv.transaction();
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				const workoutQuery=cds.parse.cql(
					"SELECT from Workouts { id, status, purchase.type, purchase.quantity } "+
					" where id='"+req.data.id+"' and client.id='"+profile.id+"'"
				);
				return tx.run(workoutQuery);
			}).then(function(workouts){
				if (!workouts[0])  return Promise.reject({errCode: errors.NOT_ALLOWED});
				return Promise.resolve(workouts[0]);
			}).then(function(workout){
				if (req.data['status'] && workout.status!='S') Promise.reject({errCode: errors.NOT_ALLOWED});
				if (req.data['status']=='E' && workout.purchase.quantity<1) return Promise.reject({errCode: errors.NOT_ENOUGH_FUNDS});
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.after('UPDATE', Workouts, (each,req) => {
			function payCoach(purchase){
				return tx.update(Purchases,{id:workout.purchase_id}).with({ quantity:{"-=":1} }).then(function(purchase){
					return tx.read(Payments,{id:purchase.activePaymentId}); // whats each workout would worth
				}).then(function(payment){
					const price=payment.cost/payment.quantity;
					var actions=[
						tx.update(Payments,{id:payment.id}).with({ remainder:{"-=": price} }),
						tx.create(CoachBilling).entries({
							id:uuidv1(),
							purchase_id:purch.id,
							coach_id:purch.coach_id,
							billingDate:purch.modifiedAt,
							amount:price
						})
					];
					return Promise.all(actions);
				});
			}
			const workout=each;
			if (req.data['status']!='E') return;
			const tx = srv.transaction();
			return tx.read(Purchases,{id:workout.purchase_id}).then(function(purchase){
				if (purchase.type=='R') return payCoach(purchase);
				else return Promise.resolve();
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});		
		
	});

	cds.serve("CoachService").in(app).with(function(srv){

		const { 
			Profiles, CoachesToGyms, MyActivePurchases, ActivePurchases, 
			Workouts, ChatMessages, CoachBilling, MyMoney, Content, WorkoutsToContent } = srv.entities;
		const baseUrl = '/rest/coach';
		
		const cardActions={
			calendar:function(profile,svc){
				var actions={};
				const tx = svc.transaction();
				const nextWorkoutQuery=SELECT.one(Workouts).columns('id','status','timestamp').where({
					coach_id:profile.id,
					status:'S',
					timestamp:{ ">": (new Date()).toJSON() }
				}).orderBy({timestamp:'asc'});
				return tx.run(nextWorkoutQuery).then(function(next){
					if (next) actions['nextWorkout']={ dst: 'workout', vars: { id: next.id } };
					return Promise.resolve({ card:'calendar', actions:actions });
				});
			}
		};
		
		app.get(baseUrl + '/onboard', function(req, res){
			var deviceId = req.query.device;
			var authToken = req.query.token;
			if (!(deviceId && authToken)) res.status(403).send({errCode: errors.NOT_ENOUGH_ONBOARD_DATA});
			const tx = srv.transaction();
			tx.read(Profiles).where({ authToken:authToken, deviceId:null }).then(function(profiles){
				if (profiles[0]){
					const id=profiles[0].id;
					return tx.update(Profiles,{id:id}).with({
						deviceId:deviceId,
						authToken:crypto.createHash('md5').update(id+deviceId).digest('hex')
					});
				} else return Promise.reject({errCode: errors.ONBOARD_PROFILE_NOT_FOUND});
			}).then(function(profile){
				res.send(profile);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);				
			});
		});
		
		app.get(baseUrl + '/init', function(req, res){
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				return getCards("cardsCoach",profile,cardActions,srv);
			}).then(function(initData){
				res.send(initData);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		app.get(baseUrl + '/getCalendar', function(req, res){
			const tx = srv.transaction();
			return basicChecks(srv, req.query.device,req.query.token).then(function(profile){
				const workoutQuery=cds.parse.cql(
					"SELECT from Workouts { "+
						"id, status, timestamp, durationHrs, purchase.type, purchase.gym.name as gymName, "+
						"client.nickName as clientName "+
					"} where coach.id='"+profile.id+"'"
				);
				return tx.run(workoutQuery);
			}).then(function(workouts){
				res.send(workouts);
			}).catch(function(err){
				if (!err.errCode) res.status(400).send({errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else res.status(400).send(err);	
			});
		});
		
		srv.on ('createChatMessage', req => {
			const tx = srv.transaction();
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				const q=cds.parse.cql( 
					"SELECT from Purchases { id, coach_id } "+
					"where chatChannel.channelId='"+req.data.channelId+"' and coach.id='"+profile.id+"'"
				);
				return tx.run(q)
			}).then(function(purchases){
				if (!purchases[0])  return Promise.reject({errCode: errors.NOT_ALLOWED});
				return tx.create(ChatMessages).entries({
					id:uuidv1(),
					channel_channelId:req.data.channelId,
					message_text:req.data.text,
					message_authorId:purchases[0].coach_id,
					message_timestamp:new Date()
				});
			}).then(function(msg){
				return req.reply(msg.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});		
		
		srv.before(['READ', 'CREATE', 'UPDATE', 'DELETE'], genericAuthCheck);
		
		srv.before(['CREATE','DELETE'], CoachesToGyms, req => {
			return basicChecks(srv, req._.query.device,req._.query.token).then(function(profile){
				if (profile.id!=req.data.coach_id) return Promise.reject({errCode: errors.NOT_ALLOWED});
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.before('CREATE', Profiles, forbidProfileCreation);
		
		srv.before('UPDATE', Profiles, req => {
			if (!req._.req) return; // in process of onboarding the coach
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				if (profile.id!=req.data.id) return Promise.reject(400,{errCode: errors.NOT_ALLOWED});
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});

		srv.before('READ', MyActivePurchases, req => {
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				// const state='A';
				// req.query.where({ "state":{'=': state}, "and": {"coach_id":{"=":profile.id }} });
				req.query.where({ "coach_id":{"=":profile.id } });
				return Promise.resolve(profile.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.before('READ', ActivePurchases, req => {
			req.reject(403,{errCode: errors.NOT_ALLOWED});
		});
		
		srv.before('READ', MyMoney, req => {
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				req.query.where({ "id":{"=":profile.id } });
				return Promise.resolve(profile.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});	
		
		srv.after('READ', MyMoney, each => {
			function getWeeklyTarget(coachId){
				return getSettings(srv).then(function(settings){ // this shit only works if settings are already read from db. rtfm
					const weeklyTarget=parseInt(settings["billing"]["target"]["weekly"]);
					return Promise.resolve(weeklyTarget);
				});
			}
			return getWeeklyTarget(each.id).then(function(target){
				each.target=target;
			});
		});
		
		srv.before('READ', CoachBilling, req => {
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				req.query.where({ "coach_id":{"=":profile.id } });
				return Promise.resolve(profile.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});		

		srv.before('UPDATE', Workouts, req => {
			const tx = srv.transaction();
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				const workoutQuery=cds.parse.cql(
					"SELECT from Workouts { id, status, purchase.type, purchase.quantity } "+
					" where id='"+req.data.id+"' and coach.id='"+profile.id+"'"
				);
				return tx.run(workoutQuery);
			}).then(function(workouts){
				if (!workouts[0])  return Promise.reject({errCode: errors.NOT_ALLOWED});
				return Promise.resolve(workouts[0]);
			}).then(function(workout){
				if (workout.purchase.quantity<1) return Promise.reject({errCode: errors.NOT_ENOUGH_FUNDS});
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});
		
		srv.before('READ', Content, req => {
			return basicChecks(srv, req._.req.query.device,req._.req.query.token).then(function(profile){
				req.query.where({ "author_id":{"=":profile.id } });
				return Promise.resolve(profile.id);
			}).catch(function(err){
				if (!err.errCode) req.reject(400,{errCode: errors.UNKNOWN_BACKEND_ERROR, errObj:err});
				else req.reject(400,err);
			});
		});			
		
	});

});
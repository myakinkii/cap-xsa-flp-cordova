sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ru/fitrepublic/shared/model/appMgr",
	"sap/ui/model/json/JSONModel"
], function (Controller, AppMgr, JSONModel) {
	"use strict";

	return Controller.extend("ru.fitrepublic.cards.chatMessages.Main", {
		
		onInit: function () {
			var mdl=new JSONModel();
			this.getView().setModel(mdl);
			this.getOwnerComponent().initPromise.then(function(data){
				var firstChannel=data.results[0].channelId;
				mdl.setData({
					channels:data.results,
					messages:{},
					selectedChannel:firstChannel
				});
				this.setMessages(mdl,firstChannel);
				this.prepareMessageAuthors(data);

			}.bind(this)).catch(function(err){
				console.log(err);
			});
		},
		
		switchChannel:function(e){
			var channel=e.getSource().getSelectedKey();
			this.setMessages(this.getView().getModel(),channel);
		},
		
		setMessages:function(mdl,channel){
			var list=this.getView().byId("messagesList");
			var msgLimit=3;
			AppMgr.promisedRead("/ChatMessages",{ // this way we refresh messages each time channel is switched
				"$filter":"channel_channelId eq guid'"+channel+"'",
				"$orderby":"message_timestamp desc",
				"$top":msgLimit // also we can set the messages limit
			}).then(function(data){
				var path="/messages/"+channel;
				mdl.setProperty(path,{ id: channel, messages: data.results });
				list.bindElement(path);
			});
			// var path="/Chats(guid'"+channel+"')";
			// this.getView().bindElement({ // this way odata model caches the results, so no refresh on change is done
			// 	path:path, model: "odata", 
			// 	parameters: { expand: "messages" }
			// });			
		},
		
		prepareMessageAuthors:function(data){
			this.messageAuthors=data.results.reduce(function(prev,cur){
				prev[cur.coach_id]=cur.coachNick;
				prev[cur.owner_id]=cur.ownerNick;
				return prev;
			},{});
		},
		
		decodeText:function(txt){
			return decodeURI(txt);
		},
		
		formatAuthor:function(id){
			return this.messageAuthors&&this.messageAuthors[id]||id;
		},
		
		navToPurchaseChat:function(){
			var card=this.getOwnerComponent().getCard();
			var mdlData=this.getView().getModel().getData();
			var purchId=mdlData.channels.filter(function(c){ return c.channelId==mdlData.selectedChannel; })[0].id;
			card.fireAction({
				parameters:{
					dst:"purchase",
					vars:{ id:purchId, section:"chat" }
				}
			});			
		}
		
	});
});
using { ru.fitrepublic.base as base } from '../db/base';
// using { ru.fitrepublic.coach as coach } from '../db/coach';
// using { ru.fitrepublic.client as client } from '../db/client';

service CoachService @(path:'/coach') {

  @readonly entity Settings as projection on base.Settings;
  
  @readonly entity Content as projection on base.Content;
  @readonly entity Purchases as projection on base.Purchases;
  @readonly entity CoachBilling as projection on base.CoachBilling;
  @readonly entity Gyms as projection on base.Gyms;
  @readonly entity Clients as projection on base.Clients;
  
  entity CoachesToGyms as projection on base.CoachesToGyms;

  entity Workouts as projection on base.Workouts;
  entity WorkoutsToContent as projection on base.WorkoutsToContent;
  entity Excercises as projection on base.Excercises;
  
  @readonly entity Chats as projection on base.Chats;
  entity ChatMessages as projection on base.ChatMessages;
  
  function createChatMessage (channelId : Chats.channelId, text:String) returns ChatMessages.id;

  entity Profiles as SELECT from base.Coaches {
    *
  } excluding { createdBy, modifiedBy };
 
  view MyMoney as select from CoachBilling {
    key coach.id, sum(amount) as money:Integer, 0 as target:Integer
  } where state='P' group by coach.id;

    
  // for some reason adding this breaks the purchase nav property from workouts
  //view MyChatChannels as select from Purchases {
  //  id, chatChannel.channelId, coach.id as coach_id, gym.name as gymName, owner.nickName as displayName
  //};
  
  // so we use this one to also get the chat stuff
  view MyActivePurchases as select from Purchases { 
    id, state, type, purchaseDate, quantity, owner.id as owner_id, coach.id as coach_id, 
    chatChannel.channelId, owner.nickName as ownerNick, coach.nickName as coachNick,
    gym.name as gymName, owner.nickName as displayName
  };
  
  view ActivePurchases (myId:UUID, state:String) as SELECT from base.Purchases {
    id, quantity, state, type, owner.id as owner_id, coach.id as coach_id, owner.nickName, coach.name
  } where owner.id=:myId and state=:state;

}

service ClientService @(path:'/client') {
  
  @readonly entity Settings as projection on base.Settings;
  
  @readonly entity Content as projection on base.Content;
  @readonly entity Coaches as projection on base.Coaches;
  @readonly entity CoachesToGyms as projection on base.CoachesToGyms;
  @readonly entity Gyms as projection on base.Gyms;
  
  entity Purchases as projection on base.Purchases;
  entity Payments as projection on base.Payments;
  entity CoachBilling as projection on base.CoachBilling;
  entity Workouts as projection on base.Workouts;
  @readonly entity WorkoutsToContent as projection on base.WorkoutsToContent;
  entity Excercises as projection on base.Excercises;
  
  entity Chats as projection on base.Chats
  entity ChatMessages as projection on base.ChatMessages;
  
  function makePurchase (coach_id : Coaches.id, gym_id: Gyms.id, purchaseType:String, quantity: Integer, cost:Integer) returns Purchases.id;
  function addPayment (purchase_id:Purchases.id, quantity: Integer, cost:Integer) returns Payments.id;
  function createWorkout (purchase_id: Purchases.id, timestamp:Timestamp ) returns Workouts.id;
  function createChatMessage (channelId : Chats.channelId, text:String) returns ChatMessages.id;
  
  view MyActivePurchases as select from Purchases { 
    id, state, type, purchaseDate, quantity, owner.id as owner_id, coach.id as coach_id, 
    chatChannel.channelId, owner.nickName as ownerNick, coach.nickName as coachNick,
    gym.name as gymName, coach.name as displayName
  };  

  entity Profiles as SELECT from base.Clients {
    *
  } excluding { createdBy, modifiedBy };

}
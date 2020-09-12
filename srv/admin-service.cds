using { ru.fitrepublic.base as base } from '../db/base';
// using { ru.fitrepublic.coach as coach } from '../db/coach';
// using { ru.fitrepublic.client as client } from '../db/client';

service AdminService @(path:'/admin') {

  entity Settings as projection on base.Settings;
  entity Clients as projection on base.Clients;
  entity Coaches as projection on base.Coaches;
  entity CoachesToGyms as projection on base.CoachesToGyms;
  entity Gyms as projection on base.Gyms;
  entity Purchases as projection on base.Purchases;
  entity Payments as projection on base.Payments;
  entity CoachBilling as projection on base.CoachBilling;
  entity Workouts as projection on base.Workouts;
  entity Content as projection on base.Content;

}
"use strict";

const User = require("./User");
const Member = require("./Member");
const Position = require("./Position");
const Parish = require("./Parish");
const Event = require("./Event");
const EventRegistration = require("./EventRegistration");
const Payment = require("./Payment");

// User <-> Member (1:1)
if (!User.associations.member) {
    User.hasOne(Member, { foreignKey: "userId", as: "member" });
}

if (!Member.associations.user) {
    Member.belongsTo(User, { foreignKey: "userId", as: "user" });
}

// Position <-> Member (1:N)
if (!Position.associations.members) {
    Position.hasMany(Member, { foreignKey: "positionId", as: "members" });
}

if (!Member.associations.position) {
    Member.belongsTo(Position, { foreignKey: "positionId", as: "position" });
}

// Parish <-> Member (1:N)
if (!Parish.associations.members) {
    Parish.hasMany(Member, { foreignKey: "parishId", as: "members" });
}

if (!Member.associations.parish) {
    Member.belongsTo(Parish, { foreignKey: "parishId", as: "parish" });
}

// Event <-> EventRegistration (1:N)
if (!Event.associations.registrations) {
    Event.hasMany(EventRegistration, { foreignKey: "eventId", as: "registrations" });
}

if (!EventRegistration.associations.event) {
    EventRegistration.belongsTo(Event, { foreignKey: "eventId", as: "event" });
}

// Parish <-> EventRegistration (1:N)
if (!Parish.associations.registrations) {
    Parish.hasMany(EventRegistration, { foreignKey: "parishId", as: "registrations" });
}

if (!EventRegistration.associations.parish) {
    EventRegistration.belongsTo(Parish, { foreignKey: "parishId", as: "parish" });
}

// Member <-> Payment (1:N)
if (!Member.associations.payments) {
    Member.hasMany(Payment, { foreignKey: "memberId", as: "payments" });
}

if (!Payment.associations.member) {
    Payment.belongsTo(Member, { foreignKey: "memberId", as: "member" });
}

// Parish <-> Payment (1:N)
if (!Parish.associations.payments) {
    Parish.hasMany(Payment, { foreignKey: "parishId", as: "payments" });
}

if (!Payment.associations.parish) {
    Payment.belongsTo(Parish, { foreignKey: "parishId", as: "parish" });
}

// Approval relation for offline approvals
if (!Member.associations.approvedPayments) {
    Member.hasMany(Payment, { foreignKey: "approvedBy", as: "approvedPayments" });
}

if (!Payment.associations.approver) {
    Payment.belongsTo(Member, { foreignKey: "approvedBy", as: "approver" });
}

module.exports = {
    User,
    Member,
    Position,
    Parish,
    Event,
    EventRegistration,
    Payment
};
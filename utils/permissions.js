const config = require('../config.json');
const store = require('./store');

function isOwner(userId) {
  const configOwners = config.ownerIds || [];
  const dynamicOwners = store.getOwners();
  return configOwners.includes(userId) || dynamicOwners.includes(userId);
}

function getAllOwners() {
  const configOwners = config.ownerIds || [];
  const dynamicOwners = store.getOwners();
  return [...new Set([...configOwners, ...dynamicOwners])];
}

module.exports = { isOwner, getAllOwners };

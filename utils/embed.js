const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function baseEmbed() {
  return new EmbedBuilder().setColor(config.embedColor || '#8A2BE2');
}

function success(desc) {
  return baseEmbed().setDescription(`✅ ${desc}`);
}

function error(desc) {
  return baseEmbed().setColor('#FF4444').setDescription(`❌ ${desc}`);
}

function info(desc) {
  return baseEmbed().setDescription(`ℹ️ ${desc}`);
}

module.exports = { baseEmbed, success, error, info };

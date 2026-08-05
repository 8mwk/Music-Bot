const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'loop',
  aliases: ['repeat'],
  description: 'Sets the loop mode: off, track, or queue.',
  usage: 'loop <off|track|queue>',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const mode = (args[0] || '').toLowerCase();
    const valid = ['off', 'track', 'queue'];
    if (!valid.includes(mode)) {
      return message.reply({ embeds: [errEmbed(`Usage: \`${client.config.prefix}loop <off|track|queue>\``)] });
    }

    await player.setRepeatMode(mode);
    const labels = { off: 'Off', track: 'Current Track 🔂', queue: 'Whole Queue 🔁' };
    message.reply({ embeds: [success(`Loop mode set to: **${labels[mode]}**`)] });
  },
};

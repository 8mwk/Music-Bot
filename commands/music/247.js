const { success } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: '247',
  aliases: ['247mode', 'stay'],
  description: 'Toggles 24/7 mode so the bot stays in voice even when the queue empties.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const current = player.get('twentyFourSeven') || false;
    player.set('twentyFourSeven', !current);

    message.reply({
      embeds: [success(`24/7 mode is now **${!current ? 'enabled' : 'disabled'}**.`)],
    });
  },
};

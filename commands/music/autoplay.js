const { success } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'autoplay',
  aliases: ['ap'],
  description: 'Toggles autoplay (auto-queues a related track when the queue ends).',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const current = player.get('autoplay') || false;
    player.set('autoplay', !current);

    message.reply({
      embeds: [success(`Autoplay is now **${!current ? 'enabled' : 'disabled'}**.`)],
    });
  },
};

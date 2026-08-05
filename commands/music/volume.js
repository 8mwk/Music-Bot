const { success, error: errEmbed, baseEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

const MAX_VOLUME = 10000;
const MIN_VOLUME = 1;

module.exports = {
  name: 'volume',
  aliases: ['vol', 'v'],
  description: `Sets the playback volume (${MIN_VOLUME}-${MAX_VOLUME}).`,
  usage: 'volume <1-10000>',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    if (!args.length) {
      return message.reply({
        embeds: [baseEmbed().setDescription(`🔊 Current volume: **${player.volume}%**`)],
      });
    }

    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < MIN_VOLUME || amount > MAX_VOLUME) {
      return message.reply({
        embeds: [errEmbed(`Please provide a volume between **${MIN_VOLUME}** and **${MAX_VOLUME}**.`)],
      });
    }

    // NOTE: standard Lavalink nodes cap the "volume" op at 1000 by default.
    // To allow values up to 10000 your Lavalink node's application.yml needs:
    //   lavalink.server.filters.volume: true
    // and no additional cap set — some node builds silently clamp to 1000/5000.
    // If you hit a hard ceiling, that's a node-side limit, not this bot.
    await player.setVolume(amount, true);
    message.reply({ embeds: [success(`Volume set to **${amount}%**.`)] });
  },
};

const { success, error: errEmbed, baseEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'grab',
  description: 'DMs you the currently playing track so you can save it for later.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client, { requirePlaying: true });
    if (!player) return;

    const track = player.queue.current;
    if (!track) return message.reply({ embeds: [errEmbed('Nothing is playing right now.')] });

    try {
      await message.author.send({
        embeds: [
          baseEmbed()
            .setTitle('🎧 Grabbed Track')
            .setDescription(`[${track.info.title}](${track.info.uri})`)
            .setThumbnail(track.info.artworkUrl || null),
        ],
      });
      message.react('📬').catch(() => {});
    } catch {
      message.reply({ embeds: [errEmbed('I couldn\u2019t DM you — check your privacy settings.')] });
    }
  },
};

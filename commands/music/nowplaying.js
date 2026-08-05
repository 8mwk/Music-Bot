const { baseEmbed, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

function progressBar(position, duration, size = 20) {
  if (!duration || duration <= 0) return '🔴 LIVE';
  const ratio = Math.min(position / duration, 1);
  const filledCount = Math.round(size * ratio);
  const bar = '▬'.repeat(filledCount) + '🔘' + '▬'.repeat(Math.max(0, size - filledCount));
  return bar;
}

module.exports = {
  name: 'nowplaying',
  aliases: ['np'],
  description: 'Shows the currently playing track with a progress bar.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client, { requirePlaying: true });
    if (!player) return;

    const track = player.queue.current;
    if (!track) return message.reply({ embeds: [errEmbed('Nothing is playing right now.')] });

    const position = player.position || 0;
    const duration = track.info.duration;

    const embed = baseEmbed()
      .setTitle('🎶 Now Playing')
      .setDescription(`[${track.info.title}](${track.info.uri})`)
      .addFields(
        {
          name: 'Progress',
          value: `\`${client.msToTime(position)}\` ${progressBar(position, duration)} \`${
            track.info.isStream ? 'LIVE' : client.msToTime(duration)
          }\``,
        },
        { name: 'Author', value: track.info.author || 'Unknown', inline: true },
        { name: 'Volume', value: `${player.volume}%`, inline: true },
        {
          name: 'Loop',
          value: player.repeatMode === 'off' ? 'Off' : player.repeatMode === 'track' ? 'Track' : 'Queue',
          inline: true,
        },
        { name: 'Requested by', value: `<@${track.requester?.id || track.requester}>`, inline: true }
      )
      .setThumbnail(track.info.artworkUrl || null);

    message.reply({ embeds: [embed] });
  },
};

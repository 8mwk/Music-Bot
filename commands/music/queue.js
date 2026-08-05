const { baseEmbed, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'queue',
  aliases: ['q'],
  description: 'Shows the current queue.',
  usage: 'queue [page]',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const tracks = player.queue.tracks;
    if (!player.queue.current && !tracks.length) {
      return message.reply({ embeds: [errEmbed('The queue is empty.')] });
    }

    const perPage = 10;
    const page = Math.max(1, parseInt(args[0], 10) || 1);
    const totalPages = Math.max(1, Math.ceil(tracks.length / perPage));
    const start = (page - 1) * perPage;
    const pageTracks = tracks.slice(start, start + perPage);

    const list = pageTracks
      .map((t, i) => `**${start + i + 1}.** [${t.info.title}](${t.info.uri}) — \`${client.msToTime(t.info.duration)}\``)
      .join('\n') || '*No upcoming tracks.*';

    const embed = baseEmbed()
      .setTitle('🎵 Queue')
      .setDescription(
        `**Now Playing:** ${
          player.queue.current
            ? `[${player.queue.current.info.title}](${player.queue.current.info.uri})`
            : 'Nothing'
        }\n\n${list}`
      )
      .setFooter({ text: `Page ${page}/${totalPages} • ${tracks.length} track(s) queued` });

    message.reply({ embeds: [embed] });
  },
};

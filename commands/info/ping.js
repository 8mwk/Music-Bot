const { baseEmbed } = require('../../utils/embed');

module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Shows the bot\u2019s websocket and Lavalink node latency.',
  execute: async (message, args, client) => {
    const player = client.lavalink.getPlayer(message.guild.id);
    const nodePing = player?.node?.ping ?? 'N/A';

    message.reply({
      embeds: [
        baseEmbed()
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Websocket', value: `${client.ws.ping}ms`, inline: true },
            { name: 'Lavalink Node', value: `${nodePing}${nodePing !== 'N/A' ? 'ms' : ''}`, inline: true }
          ),
      ],
    });
  },
};

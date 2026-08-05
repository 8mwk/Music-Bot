const { baseEmbed } = require('../../utils/embed');
const { getAllOwners } = require('../../utils/permissions');

const CATEGORY_LABELS = {
  music: '🎵 Music',
  owner: '👑 Owner',
  info: 'ℹ️ Info',
};

module.exports = {
  name: 'bi',
  aliases: ['botinfo', 'help', 'commands'],
  description: 'Shows every bot command, grouped by category, plus the bot owner(s).',
  execute: async (message, args, client) => {
    const owners = getAllOwners();
    const ownerMentions = owners.length ? owners.map((id) => `<@${id}>`).join(', ') : 'Not set';

    const byCategory = {};
    for (const cmd of client.commands.values()) {
      if (!byCategory[cmd.category]) byCategory[cmd.category] = [];
      byCategory[cmd.category].push(cmd);
    }

    const embed = baseEmbed()
      .setTitle(`🤖 ${client.user.username} — Bot Info`)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        [
          `**Owner(s):** ${ownerMentions}`,
          `**Prefix:** \`${client.config.prefix}\` (owners & approved users can also use **no prefix**)`,
          `**Servers:** ${client.guilds.cache.size}`,
          `**Commands:** ${client.commands.size}`,
        ].join('\n')
      );

    for (const [category, cmds] of Object.entries(byCategory)) {
      const label = CATEGORY_LABELS[category] || category;
      const list = cmds
        .map((c) => `\`${c.name}\`${c.aliases?.length ? ` (${c.aliases.join(', ')})` : ''}`)
        .sort()
        .join(', ');
      embed.addFields({ name: label, value: list });
    }

    embed.setFooter({ text: `Use ${client.config.prefix}help <command> for more — coming soon!` });

    message.reply({ embeds: [embed] });
  },
};

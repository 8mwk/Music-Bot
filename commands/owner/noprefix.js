const { success, error: errEmbed, baseEmbed } = require('../../utils/embed');
const store = require('../../utils/store');

module.exports = {
  name: 'noprefix',
  aliases: ['np-user', 'nopfx'],
  description: 'Manage which users can run commands without any prefix (owner only).',
  usage: 'noprefix <add|remove|list> [@user]',
  ownerOnly: true,
  execute: async (message, args, client) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'list') {
      const list = store.getNoPrefixUsers();
      if (!list.length) {
        return message.reply({ embeds: [baseEmbed().setDescription('No users currently have no-prefix enabled.')] });
      }
      return message.reply({
        embeds: [
          baseEmbed()
            .setTitle('No-Prefix Users')
            .setDescription(list.map((id) => `• <@${id}> (\`${id}\`)`).join('\n')),
        ],
      });
    }

    if (sub !== 'add' && sub !== 'remove') {
      return message.reply({
        embeds: [errEmbed(`Usage: \`${client.config.prefix}noprefix <add|remove|list> [@user]\``)],
      });
    }

    const target = message.mentions.users.first() || (args[1] && (await client.users.fetch(args[1]).catch(() => null)));
    if (!target) {
      return message.reply({ embeds: [errEmbed('Please mention a valid user, e.g. `noprefix add @user`.')] });
    }

    if (sub === 'add') {
      store.addNoPrefix(target.id);
      message.reply({ embeds: [success(`${target.tag} can now use commands with **no prefix**.`)] });
    } else {
      store.removeNoPrefix(target.id);
      message.reply({ embeds: [success(`${target.tag} no longer has no-prefix access.`)] });
    }
  },
};

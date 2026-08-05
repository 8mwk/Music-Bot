const { success, error: errEmbed, baseEmbed } = require('../../utils/embed');
const store = require('../../utils/store');
const config = require('../../config.json');
const { getAllOwners } = require('../../utils/permissions');

module.exports = {
  name: 'owner',
  aliases: ['owners'],
  description: 'Manage bot owners (owner only). Config-file owners cannot be removed here.',
  usage: 'owner <add|remove|list> [@user]',
  ownerOnly: true,
  execute: async (message, args, client) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'list' || !sub) {
      const list = getAllOwners();
      return message.reply({
        embeds: [
          baseEmbed()
            .setTitle('Bot Owners')
            .setDescription(list.map((id) => `• <@${id}> (\`${id}\`)`).join('\n') || 'No owners set.'),
        ],
      });
    }

    if (sub !== 'add' && sub !== 'remove') {
      return message.reply({
        embeds: [errEmbed(`Usage: \`${client.config.prefix}owner <add|remove|list> [@user]\``)],
      });
    }

    const target = message.mentions.users.first() || (args[1] && (await client.users.fetch(args[1]).catch(() => null)));
    if (!target) {
      return message.reply({ embeds: [errEmbed('Please mention a valid user, e.g. `owner add @user`.')] });
    }

    if (sub === 'add') {
      store.addOwner(target.id);
      message.reply({ embeds: [success(`${target.tag} is now a bot owner.`)] });
    } else {
      if (config.ownerIds.includes(target.id)) {
        return message.reply({
          embeds: [errEmbed('That user is a permanent owner set in `config.json` and cannot be removed here.')],
        });
      }
      store.removeOwner(target.id);
      message.reply({ embeds: [success(`${target.tag} is no longer a bot owner.`)] });
    }
  },
};

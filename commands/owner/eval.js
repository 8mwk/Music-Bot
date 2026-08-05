const { baseEmbed, error: errEmbed } = require('../../utils/embed');

module.exports = {
  name: 'eval',
  aliases: ['ev'],
  description: 'Evaluates raw JavaScript (owner only, use with care).',
  usage: 'eval <code>',
  ownerOnly: true,
  execute: async (message, args, client) => {
    const code = args.join(' ');
    if (!code) return message.reply({ embeds: [errEmbed('Provide code to evaluate.')] });

    try {
      let output = await eval(code);
      if (typeof output !== 'string') output = require('util').inspect(output, { depth: 1 });
      if (output.length > 1900) output = output.slice(0, 1900) + '\n... (truncated)';

      message.reply({
        embeds: [baseEmbed().setTitle('Eval Result').setDescription(`\`\`\`js\n${output}\n\`\`\``)],
      });
    } catch (err) {
      message.reply({ embeds: [errEmbed(`\`\`\`js\n${err}\n\`\`\``)] });
    }
  },
};

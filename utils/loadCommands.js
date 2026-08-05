const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath).filter((f) =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      const cmd = require(path.join(categoryPath, file));
      if (!cmd.name || !cmd.execute) {
        console.warn(`[commands] Skipping invalid command file: ${category}/${file}`);
        continue;
      }
      cmd.category = category;
      client.commands.set(cmd.name, cmd);
      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          client.aliases.set(alias, cmd.name);
        }
      }
    }
  }

  console.log(`[commands] Loaded ${client.commands.size} commands.`);
}

module.exports = loadCommands;

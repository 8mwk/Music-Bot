module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`[ready] Logged in as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: `${client.config.prefix}bi | your music`, type: 2 }],
      status: 'dnd',
    });

    // Initialize the Lavalink manager once the client is ready & has an ID.
    if (!client.lavalink.initiated) {
      await client.lavalink.init({ id: client.user.id, username: client.user.username });
    }
  },
};

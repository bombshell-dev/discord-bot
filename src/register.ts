import path from 'node:path';
import { type RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v10';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.dev.vars') });

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
	console.error('The required tokens to register commands were not present');
	process.exit(1);
}

import { REST } from '@discordjs/rest';
import { commands } from './commands/index.js';

const rest: REST = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const registry: RESTPostAPIApplicationCommandsJSONBody[] = [];
for (const command of Object.values(commands)) {
	registry.push(command.data.toJSON());
}

console.log(`Started refreshing ${commands.length} commands.`);

const data = await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });

console.log(`Successfully reloaded ${registry.length} commands.`);

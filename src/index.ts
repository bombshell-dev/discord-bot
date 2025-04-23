import type { ExecutionContext } from '@cloudflare/workers-types';
import type {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteractionData,
	APIBaseInteraction,
	APIChatInputApplicationCommandInteraction,
	APIMessageComponentInteraction,
	APIMessageComponentInteractionData,
} from 'discord-api-types/v10';
import { InteractionType } from 'discord-api-types/v10'
import { InteractionResponseType } from 'discord-interactions';
import { Router } from 'itty-router';
import { commands } from './commands/index.ts';
import { InteractionClient } from './discordClient.ts';
import type { Env } from './types.ts';
import { verifyDiscordRequest } from './utils/discordUtils.ts';

const router = Router();

router.get('/', async () => {
	return new Response('Hello World!');
});

router.post('/', async (request, env: Env, ctx: ExecutionContext) => {
	const discordRequestData = await verifyDiscordRequest(request, env);

	const { interaction } = discordRequestData;

	if (!discordRequestData.isValid || !interaction) {
		return new Response('Bad request signature.', { status: 401 });
	}

	if (interaction.type === InteractionType.Ping) {
		return new Response(JSON.stringify({ type: InteractionResponseType.PONG }));
	}

	if (interaction.type === InteractionType.ApplicationCommand) {
		const application = interaction as APIChatInputApplicationCommandInteraction;
		const interactionData = interaction.data as APIApplicationCommandInteractionData;

		const command = commands[interactionData.name];

		if (command) {
			if (command.initialize) {
				if (!command.initialize(env)) {
					return new Response('Internal error', { status: 500 });
				}
			}

			return command.execute(new InteractionClient(application, env, ctx));
		}

		return new Response('Command not found', { status: 404 });
	}

	if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
		const autocomplete = interaction as APIApplicationCommandAutocompleteInteraction;
		const data = interaction.data as APIApplicationCommandInteractionData;

		const command = commands[data.name];

		if (command) {
			if (command.autocomplete) {
				if (command.initialize) {
					if (!command.initialize(env)) {
						return new Response('Internal error', { status: 500 });
					}
				}

				return command.autocomplete(new InteractionClient(autocomplete, env, ctx));
			}
		}
		return new Response('Command not found', { status: 404 });
	}

	if (interaction.type === InteractionType.MessageComponent) {
		const message = interaction as unknown as APIMessageComponentInteraction;
		const data = interaction.data as unknown as APIMessageComponentInteractionData;

		// biome-ignore lint/style/noNonNullAssertion: guaranteed to be non-null
		const command = commands[data.custom_id.split('-')[0]!];

		if (command) {
			if (command.button) {
				if (command.initialize) {
					if (!command.initialize(env)) {
						return new Response('Internal error', { status: 500 });
					}
				}

				return command.button(new InteractionClient(message, env, ctx));
			}
		}
	}

	return new Response('Not found', { status: 404 });
});

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const response = await router.handle(request, env, ctx);

			return response ?? new Response('Not found', { status: 404 });
		} catch (error) {
			console.error(error);

			return new Response('Internal Server Error', { status: 500 });
		}
	},
};

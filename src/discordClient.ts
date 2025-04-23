import type { APIBaseInteraction, InteractionType } from 'discord-api-types/v10';
import { InteractionResponseType, MessageFlags } from 'discord-api-types/v10';
import type { Env } from './types.ts';

class DiscordResponse extends Response {
	constructor(body?: Record<string|number|symbol, unknown>, _init?: ResponseInit) {
		const jsonBody = JSON.stringify(body);
		const init = _init ?? {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		}
		super(jsonBody, init);
	}
}

export class DiscordClient {
	env: Env;
	ctx: ExecutionContext;

	constructor(env: Env, ctx: ExecutionContext) {
		this.env = env;
		this.ctx = ctx;
	}
}

export type DeferOptions = {
	hidden?: boolean;
};

export class InteractionClient<Type extends InteractionType = InteractionType, Data = any> extends DiscordClient {
	interaction: APIBaseInteraction<Type, Data>;

	constructor(interaction: APIBaseInteraction<Type, any>, env: Env, ctx: ExecutionContext) {
		super(env, ctx);

		this.interaction = interaction;
	}

	deferReply(options: DeferOptions, promise?: () => Promise<Record<string, unknown>>): Response {
		if (promise) {
			this.ctx.waitUntil(promise());
		}

		const data: Record<string, unknown> = {};

		if (options.hidden) {
			data.flags = MessageFlags.Ephemeral;
		}

		return Response.json({
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data,
		});
	}

	deferUpdate(promise?: () => Promise<void>): DiscordResponse {
		if (promise) {
			this.ctx.waitUntil(promise());
		}

		return new DiscordResponse({
			type: InteractionResponseType.DeferredMessageUpdate,
		});
	}

	reply(data: Record<string, unknown>): DiscordResponse {
		return new DiscordResponse({
			type: InteractionResponseType.ChannelMessageWithSource,
			data,
		});
	}

	autocomplete(choices: string[]): DiscordResponse {
		return new DiscordResponse({
			type: InteractionResponseType.ApplicationCommandAutocompleteResult,
			data: {
				choices,
			},
		});
	}
}

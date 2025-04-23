import type {
	APIApplicationCommandInteractionDataBooleanOption,
	APIApplicationCommandInteractionDataOption,
	APIApplicationCommandInteractionDataStringOption,
	APIBaseInteraction,
	APIChatInputApplicationCommandInteractionData,
	InteractionType,
} from 'discord-api-types/v10';
	
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import type { Env } from '../types.ts';

export async function verifyDiscordRequest(request: Request, env: Env) {
	const signature = request.headers.get('x-signature-ed25519');
	const timestamp = request.headers.get('x-signature-timestamp');
	const body = await request.text();
	const isValidRequest = signature && timestamp && verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body) as APIBaseInteraction<InteractionType, unknown>, isValid: true };
}

export function getStringOption(data: APIChatInputApplicationCommandInteractionData, name: string) {
	if (!data.options) return undefined;

	const option = data.options.filter(option => isStringOption(option)).find(option => option.name === name);
	return option?.value;
}

export function getBooleanOption(data: APIChatInputApplicationCommandInteractionData, name: string) {
	if (!data.options) return false;
	const option = data.options.filter(option => isBooleanOption(option)).find(option => option.name === name);
	return option?.value ?? false;
}

function isStringOption(option: APIApplicationCommandInteractionDataOption<InteractionType.ApplicationCommand>): option is APIApplicationCommandInteractionDataStringOption {
	return option.type === ApplicationCommandOptionType.String;
}

function isBooleanOption(option: APIApplicationCommandInteractionDataOption<InteractionType.ApplicationCommand>): option is APIApplicationCommandInteractionDataBooleanOption {
	return option.type === ApplicationCommandOptionType.Boolean;
}

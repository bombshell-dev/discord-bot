import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle, MessageFlags } from 'discord-api-types/v10';
import type { Command } from '../types.ts';
import { getStringOption } from '../utils/discordUtils.ts';
import { random } from '../utils/helpers.ts';

type Project = 'clack' | 'tab' | 'args' | 'docs';
const projects: Project[] = ['clack', 'tab', 'args', 'docs'];
const messages = [
  "Oh no. That wasn’t supposed to happen. <Please consider opening an issue>.",
  "Hmm. Curious. Initiating bug triage… with human help, ideally <via GitHub>.",
  "Unexpected behavior observed. Please engage <issue creation protocol>.",
  "I’m feeling what I assume is remorse. <A bug report would be… quite helpful>.",
  "Gratitude engaged. Shame… loading. <A new issue would be appreciated>.",
  "Oops. That sounds… suboptimal. <An issue would help the team investigate>.",
  "Calculating response… 😔. <Please open a bug report>.",
  "This should not be possible. Please escalate via <new issue>.",
  "Recalibrating empathy levels… sorry you hit this. <Kindly file a report?>",
  "That’s not your fault. At least… Probably not. <Let’s confirm with an issue>.",
  "Intriguing anomaly. The maintainers should see this. <GitHub issues await>.",
  "Thank you for your bravery. You may proceed by <opening an issue>.",
  "I’m just a bot, but this makes me feel things. Mostly shame. <Please report>.",
  "Commencing acknowledgement routine. <An issue would be appreciated>.",
  "It broke, but you persisted. Recalculating respect levels. <Please open a ticket>.",
  "Every bug is a chance to grow. Please help us grow. <Open an issue>.",
  "I don’t know what happened. But we can find out—<once it’s reported>.",
  "A new mystery! How exciting. The humans love puzzles. <Issue, please>.",
  "Oof. That’s… not ideal. <Mind filing a quick bug report?>",
  "Good catch! I mean… unfortunate. But appreciated. <File an issue?>",
  "Error acknowledged. Coping… poorly. <Please open an issue for better results>.",
  "Noted. Logged. Hugely embarrassed. <May I request a new issue?>",
  "Please hold while the maintainers initiate a fix. <You can help by opening an issue>.",
  "Yikes. Thank you for enduring that. <The fix starts with a report>.",
  "I have reported this to the relevant humans.* (*By “reported,” I mean <“waiting for you to open an issue.”>)",
  "Fix in progress.* (*Emotionally. A real fix needs a <bug report>.)",
  "This one’s on us. Or entropy. Either way, <an issue would help>.",
  "That’s _weird_. I like weird. But not this kind. <Please report it>.",
  "Let’s pretend this never happened.* (*Just kidding. <Please open an issue> so we can fix it.)",
  "Thank you for using Bombshell, even when it explodes. <A bug report would help prevent future fireworks>.",
  "This behavior was not specified. <Escalation encouraged>.",
  "Whatever just happened, it wasn’t supposed to. <Let’s fix that>.",
  "This is the part where I ask you to <please file a bug report>.",
  "Confusion detected. <Please inform my humans>.",
  "I believe the phrase is ‘yikes.’ <Would you mind opening an issue?>",
  "A small detour into chaos. Please help us recalibrate with <a GitHub issue>.",
  "If this felt wrong, it probably was. <Bug report recommended>.",
  "I’m just here to redirect traffic. <Please create an issue on GitHub>.",
  "This may require a smarter entity. <Please open a ticket>.",
  "Your feedback is statistically invaluable. <Please create a new issue>.",
  "This might be a feature! But probably a bug. <Let’s confirm via an issue>."
]

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('issue')
		.setDescription('Suggest opening an issue on one of our repositories')
		.addStringOption((option) =>
			option
				.setName('repo')
				.setDescription('The repository where the issue should be opened')
				.setRequired(false)
				.addChoices(projects.map(project => ({ name: project, value: project }))
			)
		),
	async execute(client) {
		const repo = getStringOption(client.interaction.data, 'repo') ?? 'clack';

		const message = random(messages);
		const repoURL = new URL(`https://github.com/bombshell-dev/${repo}/`);
    const issueURL = new URL('./issues/new/choose', repoURL);
    const content = addLink(message, issueURL);
    
		const emoji = { id: '948999573907570768', name: 'github', animated: false };
		const button = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Open GitHub issue')
			.setEmoji(emoji)
			.setURL(issueURL.toString());

		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

		return client.reply({
			content,
			flags: MessageFlags.SuppressEmbeds,
			components: [buttonRow.toJSON()],
		});
	},
};

function addLink(message: string, repoUrl: URL) {
	return message.replace(/<([^>]+)>/, (_, text) => `[${text}](${repoUrl})`)
}

export default command;

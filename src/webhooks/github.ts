import { env } from 'cloudflare:workers';
// import { ptalTable } from "@/db/schema";
// import { useDB } from "@/utils/global/useDB";
// import { editPtalMessage } from "@/utils/ptal/editPtalMessage";
import { type EmitterWebhookEvent, Webhooks, createNodeMiddleware } from "@octokit/webhooks";

type PullRequestCallback = EmitterWebhookEvent<'pull_request'>;
type PullRequestReviewCallback = EmitterWebhookEvent<'pull_request_review'>;

const webhooks = new Webhooks({
    secret: env.GITHUB_WEBHOOK_SECRET,
});

async function handlePullRequestChange(pr: PullRequestCallback) {
    const owner = pr.payload.repository.owner.login;
    const repo = pr.payload.repository.name;
    const prNumber = pr.payload.pull_request.number;

    //  getPTAL({ owner, repo, prNumber });

    //   for (const entry of data) {
    //     try {
    //       await editPtalMessage(entry, client);
    //     } catch (err) {
    //       console.error(err);
    //     }
    //   }
}

export default async function github(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const signature = request.headers.get("x-hub-signature-256")!;
    const body = await request.text();

    if (!(await webhooks.verify(body, signature))) {
        return Response.json({ error: 'unathorized' }, { status: 401 });
    }
    console.log(body);
    return new Response('Hello World!');
}

import { json } from '@sveltejs/kit';
import { execSync } from 'child_process';
import type { RequestHandler } from './$types';

// Fork a repository
export const POST: RequestHandler = async ({ request }) => {
	const { repoUrl, action } = await request.json();

	if (action === 'fork') {
		try {
			// Extract owner/repo from URL
			const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\s\.]+)/);
			if (!match) {
				return json({ error: 'Invalid GitHub URL' }, { status: 400 });
			}

			const [, owner, repo] = match;
			const cleanRepo = repo.replace('.git', '');
			const repoPath = `${owner}/${cleanRepo}`;

			console.log(`Forking ${repoPath}...`);

			// Fork the repo using gh CLI
			const result = execSync(`gh repo fork ${repoPath} --clone=false 2>&1`, {
				encoding: 'utf8',
				timeout: 60000
			});

			// Get the forked repo URL (it's in our account now)
			const whoami = execSync('gh api user -q .login', { encoding: 'utf8' }).trim();
			const forkedRepo = `${whoami}/${cleanRepo}`;
			const forkedUrl = `https://github.com/${forkedRepo}`;

			return json({
				success: true,
				originalRepo: repoPath,
				forkedRepo,
				forkedUrl,
				message: result.trim()
			});
		} catch (error) {
			const err = error as Error & { stderr?: string; stdout?: string };
			console.error('Fork error:', err);

			// Check if already forked
			if (err.stderr?.includes('already exists') || err.stdout?.includes('already exists')) {
				const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\s\.]+)/);
				if (match) {
					const [, , repo] = match;
					const cleanRepo = repo.replace('.git', '');
					const whoami = execSync('gh api user -q .login', { encoding: 'utf8' }).trim();
					const forkedRepo = `${whoami}/${cleanRepo}`;
					return json({
						success: true,
						alreadyForked: true,
						forkedRepo,
						forkedUrl: `https://github.com/${forkedRepo}`
					});
				}
			}

			return json({ error: err.message || 'Failed to fork repository' }, { status: 500 });
		}
	}

	if (action === 'analyze') {
		try {
			// Get repo info
			const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\s\.]+)/);
			if (!match) {
				return json({ error: 'Invalid GitHub URL' }, { status: 400 });
			}

			const [, owner, repo] = match;
			const cleanRepo = repo.replace('.git', '');
			const repoPath = `${owner}/${cleanRepo}`;

			// Get repo details
			const repoInfo = JSON.parse(
				execSync(`gh repo view ${repoPath} --json name,description,primaryLanguage,languages`, {
					encoding: 'utf8',
					timeout: 30000
				})
			);

			// Get file tree (limited to important files)
			const treeOutput = execSync(
				`gh api repos/${repoPath}/git/trees/HEAD?recursive=1 -q '.tree[] | select(.type=="blob") | .path' | head -100`,
				{ encoding: 'utf8', timeout: 30000 }
			);
			const tree = treeOutput.trim().split('\n').filter(Boolean);

			return json({
				success: true,
				repo: repoPath,
				info: repoInfo,
				files: tree
			});
		} catch (error) {
			const err = error as Error;
			return json({ error: err.message || 'Failed to analyze repository' }, { status: 500 });
		}
	}

	return json({ error: 'Unknown action' }, { status: 400 });
};

// Get repo info
export const GET: RequestHandler = async ({ url }) => {
	const repoUrl = url.searchParams.get('repo');

	if (!repoUrl) {
		return json({ error: 'Missing repo parameter' }, { status: 400 });
	}

	try {
		const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\s\.]+)/);
		if (!match) {
			return json({ error: 'Invalid GitHub URL' }, { status: 400 });
		}

		const [, owner, repo] = match;
		const cleanRepo = repo.replace('.git', '');
		const repoPath = `${owner}/${cleanRepo}`;

		const repoInfo = JSON.parse(
			execSync(`gh repo view ${repoPath} --json name,description,primaryLanguage,url,defaultBranchRef`, {
				encoding: 'utf8',
				timeout: 30000
			})
		);

		return json({ success: true, repo: repoPath, info: repoInfo });
	} catch (error) {
		const err = error as Error;
		return json({ error: err.message }, { status: 500 });
	}
};

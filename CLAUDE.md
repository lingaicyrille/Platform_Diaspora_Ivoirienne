# Platform Diaspora Ivoirienne — Project Rules

## Repository
- All project files (frontend, backend, configs, assets) live exclusively in `src/`
- `src/` is the git root — all commits happen here, nowhere else

## Before Any Work
1. Get the big picture: read existing files, understand current structure, check recent commits
2. Understand how the change fits into the overall architecture before writing any code

## Security
- Never hardcode secrets, passwords, API keys, or tokens in source files
- Use environment variables or `.env` files (always gitignored) for sensitive config
- Never log or expose sensitive data in responses, comments, or commit messages

## After Any Work
1. Verify the change works end-to-end (run the app, hit the relevant routes/pages, check logs)
2. Run any available tests
3. Only if all verifications pass: `git add`, `git commit`, `git push`
4. Never commit broken or partially working code

## General
- Frontend and backend code both live under `src/`
- Keep secrets out of version control at all times

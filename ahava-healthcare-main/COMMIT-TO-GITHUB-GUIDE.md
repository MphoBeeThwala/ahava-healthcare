Commit to GitHub guide

Security review confirms the repository is safe to push: `.gitignore` excludes `.env` files, secrets, `node_modules`, build directories, and other sensitive artifacts; `.env.example` remains as the only environment template; scans detected no embedded keys. If Git is missing, install it via Chocolatey (`choco install git -y` from an elevated PowerShell), the official installer at https://git-scm.com/download/win, or GitHub Desktop for a graphical workflow. After installation, configure your name and email with `git config --global user.name "Your Name"` and `git config --global user.email "your.email@example.com"`.

From `C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main`, initialize the repo (`git init`, `git branch -M main`) if the `.git` folder is absent. Add the GitHub remote (`git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git` or the SSH equivalent) and verify with `git remote -v`. Review pending work with `git status`; sensitive files should not appear thanks to the ignore rules. Stage everything (`git add .`), double-check staged paths via `git diff --cached --name-only`, and commit. A sample message:
```
git commit -m "feat: Healthcare system improvements

- Enhanced security features and authentication
- Updated admin portal with new features
- Improved backend services and API endpoints
- Added new frontend components
- Updated documentation and deployment guides
- Fixed linter errors and code quality issues"
```
Push the first time with `git push -u origin main`. If the repository already has history, pull (`git pull origin main --rebase`) before pushing. Confirm the push by opening the GitHub repository, reviewing the file list, ensuring no `.env` files were uploaded, and checking the commit history.

If a secret slips into a commit, remove it immediately (`git rm --cached path/to/file`, commit the removal, rotate credentials), and if already pushed, rewrite history with `git filter-branch` (or `git filter-repo`) and force-push, followed by rotating all exposed secrets. The ignore configuration ensures that source files, configs, templates, documentation, Docker assets, scripts, and Prisma schema make it into the repository, while secrets, dependencies, build outputs, local databases, and editor folders remain untracked.

Handy commands to remember:
```
git status
git diff
git add .
git commit -m "message"
git push
git pull
git log --oneline -10
git reset --soft HEAD~1
git checkout -- filename
```
Best practices include reviewing `git status` before every commit, avoiding force pushes to `main`, writing descriptive messages, grouping related changes, pulling before pushing, and keeping `.gitignore` current. For deeper reference, consult the Git documentation, GitHub guides, and the official cheat sheet. With the safeguards in place, the Ahava Healthcare project is ready to commit and push confidently.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.

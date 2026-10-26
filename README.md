# A²R Research Lab — GitHub Pages edition

Target address: **https://a2rlab.github.io/**

Prepared 26 October 2026 from the existing published website (version 2). This is a hosting conversion, not a refresh of the research/news content. The original design, content, photos, videos, interactions, and browser-local editor are retained. No database, ChatGPT account, Cloudflare account, API key, or paid hosting is required to run this export.

## 1. Confirm the GitHub owner

The account or organization must be named **a2rlab**, and the repository must be named **a2rlab.github.io**. Merely naming a repository this way under another account does not give you the requested address. If your lab does not control that account name, obtain an available organization/account name first and adapt the site URLs accordingly. This export is configured for the domain root, not a project subdirectory.

## 2. Create the repository

1. Sign in to GitHub with permission to manage the lab organization.
2. Select **New repository**.
3. Choose owner **a2rlab**.
4. Name it **a2rlab.github.io**.
5. Select **Public** for GitHub Free. The deployed website will be public.
6. Initialize it with a README, then create it. Use **main** as the default branch.

If that repository already hosts your lab website, clone and back it up first. Do not delete existing content or overwrite a custom setup without reviewing it.

## 3. Copy this export using GitHub Desktop

GitHub Desktop is recommended because the site contains many photos and videos; avoid uploading the ZIP itself through the web interface.

1. Install GitHub Desktop from https://desktop.github.com/ and sign in.
2. Choose **File → Clone repository**, select **a2rlab/a2rlab.github.io**, and choose a local folder.
3. Extract **a2rlab-github-pages-source.zip**.
4. Open the extracted **a2rlab.github.io** folder. Copy its **contents** into the cloned repository folder. Replace the starter README if prompted.
5. Make sure **package.json**, **pnpm-lock.yaml**, **index.html**, and the **.github** folder are directly inside the repository root. Do not accidentally put everything inside an extra nested folder. Do not copy over the clone's **.git** folder.
6. In GitHub Desktop, review the changes, enter a summary such as **Publish A2R lab website**, click **Commit to main**, then **Push origin**.

You do not need Node.js installed on your computer for this publishing method: GitHub Actions installs dependencies and builds the site remotely.

## 4. Enable automated publishing

1. On GitHub, open **a2rlab/a2rlab.github.io**.
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**. No custom domain is required; leave that field empty.
4. Open **Actions → Publish A2R lab website**.
5. If the initial run failed before Pages was enabled, use **Run workflow**, choosing **main**. If the workflow is disabled, enable it first. Organization policies must permit the official actions used by the workflow.
6. Wait for both **build** and **deploy** to turn green.
7. Open **https://a2rlab.github.io/** and **https://a2rlab.github.io/edit/**. GitHub may take several minutes to publish the first deployment.

The workflow file is `.github/workflows/deploy.yml`. Every push to **main** builds and publishes automatically; manual runs are also supported. It uses GitHub's short-lived deployment token, so do not create or paste any personal access token into the site. If your organization requires environment approval, approve the pending **github-pages** deployment in Actions.

## 5. Update lab content

1. Open **https://a2rlab.github.io/edit/**.
2. Edit the required sections. **Save local draft** only saves in this browser; **Preview draft** shows that draft locally.
3. Click **Export update** to download `a2r-content-update.json`.
4. In your cloned repository, replace `lib/lab-content.json` with the exported file, renaming it exactly to `lab-content.json`.
5. Add any new image/video files under `public/media/`. Use simple names such as `new-robot.webp`, with paths like `/media/new-robot.webp` in the content file.
6. Commit and push with GitHub Desktop. GitHub Actions publishes the update.

Anyone can open the editor, but it cannot write to GitHub or alter the public website. Only authorized repository contributors can publish. Browser drafts do not transfer automatically from the old website's domain or between computers. To transfer a draft, export it on the old editor and import it on the new one. Keep exported drafts until published successfully.

The downloadable guide at `/editor-guide.txt` contains the same update workflow. Use GitHub history to recover older content; reverting a commit and pushing publishes that previous version.

## Videos and optional YouTube hosting

All current videos remain included. The existing public media totals about 124 MB, so separate video hosting is not needed to launch.

To move a video to YouTube later:

1. Upload it to the lab's YouTube channel and choose **Unlisted** visibility. Ensure embedding is allowed. Unlisted means people with the link can watch and share it; it is not private access control.
2. In the editor, choose **Films**, select the film, and replace **Video file path** (`src`) with its YouTube watch URL or `https://youtu.be/VIDEO_ID` link.
3. Keep the film's stable ID, poster image, title, summary, and duration. Project and student-activity links use that stable ID and continue working.
4. Export the update, replace `lib/lab-content.json`, commit, and push.
5. Test playback on the live site. After confirming no other records use it, you may remove the old MP4 from `public/media/` and publish again to reduce the deployed size. Removing it does not erase the old file from Git history.

The player supports both local MP4s and YouTube links. YouTube is loaded only when the film dialog is opened. No films have been uploaded to YouTube as part of this export; external playback still depends on YouTube's availability and the video's permissions.

## Local development (optional)

Install Node.js 22.13+ and pnpm 11.25.0, then run these commands in this folder:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

To build and inspect the production version:

```sh
pnpm build
pnpm preview
```

Do not open `index.html` by double-clicking it. It needs a web server. Source files are React/TypeScript; the build generates static HTML, CSS, JavaScript, and media in `dist/`. No server runtime is needed on GitHub Pages.

The separate **a2rlab-static-site.zip** contains a ready-built copy for another static web host. Use the **source ZIP** for the automated GitHub Pages workflow; do not mix the two ZIPs in your repository.

## Troubleshooting

- **404 at the main address:** verify the account owner and repository names, Pages source, and the latest Actions deployment. The exact address requires the owner `a2rlab`.
- **No workflow listed:** verify `.github/workflows/deploy.yml` is present at the repository root and pushed to `main`.
- **Pages disabled / deployment permission error:** enable Pages with GitHub Actions and check the organization's Actions policy and `github-pages` environment rules.
- **Old content:** confirm the workflow is green, refresh the page, and leave `?draft=1` preview mode to see the published version.
- **Missing image/video:** check spelling and capitalization; GitHub hosting is case-sensitive. A `/media/...` reference points to a file in `public/media/`.
- **Editor changes visible only to you:** export the update and commit/push it as described above.
- **YouTube refuses playback:** confirm Unlisted/Public visibility, embedding permission, and video availability. Keep the local MP4 until the replacement plays correctly.

## Official documentation

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Export scope

The site content and media are retained from the original site. This export contains no original hosting credentials, `.openai` configuration, dependency folders, or private source history. Content/images retain their existing ownership and credits; no new open-source license is implied by this export. Publishing a public repository makes its source and included media publicly accessible.

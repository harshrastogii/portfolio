/* ============================================================================
   prune-deploy.mjs
   Runs on Vercel after the build, and nowhere else.

   The site deploys from the repo root (outputDirectory "."), so everything in
   the checkout is served — including the sources the build reads. That put
   the article template online as a page titled "{{TITLE}} — Harsh Rastogi",
   the Markdown originals online as a second copy of every article, and the
   build and dev scripts online beside them.

   .vercelignore cannot help: it keeps files out of the build as well, and the
   build needs these to run. Removing them from the build container once the
   build is done takes them out of the deployment without touching the repo.

   The VERCEL guard is the important line. `npm run build` is run locally all
   the time; this must never be able to delete a working tree.
============================================================================ */
import { rmSync, existsSync } from "node:fs";

if (!process.env.VERCEL) {
  console.log("prune-deploy: not running on Vercel — nothing removed");
  process.exit(0);
}

const SOURCES = [
  "articles/_article.template.html",
  "articles/posts",
  "scripts",
  "README.md",
  ".gitignore",
];

for (const path of SOURCES) {
  if (!existsSync(path)) continue;
  rmSync(path, { recursive: true, force: true });
  console.log("prune-deploy: removed", path);
}

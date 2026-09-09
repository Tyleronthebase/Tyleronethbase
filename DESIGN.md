# GitHub profile design

This is a GitHub Profile README, a content surface rendered by GitHub. It is not a standalone application; GitHub owns layout, typography, focus, and navigation behavior.

## Direction

Subject: Tianen Wang / Tyler, an AI application engineer building interfaces, developer tools, and web experiments. Audience: other developers and collaborators. The profile's job is to lead readers to actual public work.

The signature is a branching route diagram: an idea passes through an agent, tools, and an interface to become working software. An oversized name anchors the left; the quiet technical drawing balances the right. This replaces the previous generic wave banner. No portrait, fake terminal output, synthetic achievements, or invented project metrics.

## Palette and typography

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#F2F5FA` | `#111C30` |
| Ink | `#18243A` | `#F3F6FD` |
| Secondary | `#50627A` | `#A9B8D0` |
| Border | `#D8E1ED` | `#2A3C58` |
| Cobalt | `#365BD7` | `#A8BAFF` |
| Teal | `#168577` | `#74D5C5` |
| Clay | `#B95B32` | `#EDA783` |

Display: Trebuchet MS with Arial/sans-serif fallback, bold and spacious. Diagram labels: Menlo/Consolas/monospace. Body: native GitHub typography. No external fonts. Asset tokens are owned in `scripts/generate-hero.mjs` and `scripts/update-stats.mjs`; changes to the palette must update both generators together and regenerate their SVGs.

## Layout

```
┌───────────────────────────────────────────────┐
│ Tianen Wang.        idea → agent → tools      │
│ AI application      ↖ feedback ← interface   │
└───────────────────────────────────────────────┘
          blog / selected work / repos
Short introduction + one Chinese sentence
Selected work: four readable, single-column entries
Tools: three concise lines
Public repository statistics
Contribution snake (opt in through native details)
```

Important copy remains in Markdown so it reflows on phones and works without images. Every image has a meaningful fallback alt and an intrinsic viewBox. Light images are the default; dark images are selected through picture sources. The hero is static; contribution motion is collapsed by default and respects reduced-motion inside the SVG.

## Content evidence

Public role and education preserve the existing GitHub profile. Mini Chat AI, PDF Editor, and Video Downloader descriptions were checked against local source. PDF Editor remains labeled a prototype. Redis caching was removed because the inspected downloader implementation did not use it. Flare Stack Blog is explicitly attributed as a fork. Local project paths, private repository names, contact details, and local audit notes are not published.

## References

- [Awesome GitHub Profile README](https://github.com/abhisheknaiidu/awesome-github-profile-readme): concise introduction, selected work, code tags, and Actions-generated visualizations.
- [Platane/snk](https://github.com/Platane/snk): contribution animation, generated into this repository.
- [GitHub theme-aware images](https://github.blog/changelog/2022-05-19-specify-theme-context-for-images-in-markdown-beta/): picture sources for light and dark themes.
- [GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats): reviewed; its public image service is not a dependency of this profile.

## Maintenance

Hero SVGs are reproducible with `node scripts/generate-hero.mjs`. Statistics use the GitHub REST API and are generated with `node scripts/update-stats.mjs`. The Actions workflow refreshes charts daily. Keep generated assets committed so visitors never need to wait for an external statistics renderer. See `docs/MAINTENANCE.md`.

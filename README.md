# Gentle Theme Studio

Turn an image into an animated Gentle Shell Desktop theme using ordinary language. The agent selects regions in the picture; a local compiler animates those regions and keeps the original image intact across revisions.

## 1. Install in a test project

Requirements: Git, Node.js 20 or newer, Gentle Shell, and a GPUI Desktop build that supports importing `.gentletheme` files.

From the project where you want to use the skill:

```sh
git clone https://github.com/Maicololiveras/gentle-theme-studio.git
cd gentle-theme-studio
npm test
cd ..
gentle-shell install -l ./gentle-theme-studio
```

Keep the cloned directory in place. Open a fresh Gentle Shell session **from the same project**.

## 2. Ask the agent for a theme

Give the agent a readable local image path and ask:

> Use gentle-theme-studio with my reading-room illustration. Add soft rain inside the window, animate the existing steam above the cup, and give the lamp a warm glow. Keep the face and text still. Export revision 1.

Then try a targeted edit:

> Dim only the lamp. Preserve revision 1 and export revision 2. Give me both file paths.

Choose effects that fit the actual image. A still theme is also supported.

## 3. Review in Desktop

Open **Configuration → Theme → Import** and select the exported file. Review each revision before applying your favorite. The command-line interface does not render the desktop background. Each exported file embeds the source image.

## Direct compiler test

From the cloned directory, with your own image at `image.png`:

```sh
node skills/gentle-theme-studio/scripts/theme.mjs create draft image.png examples/crimson.json
node skills/gentle-theme-studio/scripts/theme.mjs export draft 1 crimson-v1.gentletheme
node skills/gentle-theme-studio/scripts/theme.mjs update draft 1 examples/dim-lamp.json
node skills/gentle-theme-studio/scripts/theme.mjs export draft 2 crimson-v2.gentletheme
```

Example regions target the wide crimson reading-room illustration. For another image the agent should select new polygons. No third-party Node dependencies or build step.

## Direct a scene in two choices

Ask “What can move in this picture?” The agent inspects the picture, asks which object interests you, and suggests motions for that choice. For example, a rainy window supports distant streaks or wet glass with beads that merge and slide. A portrait can use synchronized blinking with individually traced lids. An image without those subjects gets different suggestions. No model runs during playback.

For a reproducible example use `examples/crimson-immersive.json` with the original 1938 × 811 Crimson Window illustration in the create/export commands above. That recipe is image-specific; the compiler, presets and authoring helpers work with other images. The optional Pillow keyframe packer stores only the selected lid texture; the theme embeds the original background bytes without recompression. Natural-looking blinking requires registered artwork; there is no automatic image segmentation or video synthesis.

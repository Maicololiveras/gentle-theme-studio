---
name: gentle-theme-studio
description: Turn a user-supplied image into a revisable animated Gentle Shell Desktop GPUI theme. Use for theme design, localized motion, recoloring and preparing a native theme preview or import.
---
Inspect the actual image with the host image reader. If only a chat thumbnail is available, ask for a readable local image path. Never guess a path. Propose subtle motion, preserving faces, text and any user-designated quiet areas. Do not claim automatic segmentation. Offer still, lamp, steam, leaves and rain, individually or combined. Steam moves existing pixels; if there is no visible steam, do not promise to create it. Choose background, text and accent colors with readable contrast.

Run the helper with Node 20+ using its path relative to this SKILL.md. Work in a new local project folder. No provider keys, downloads or install scripts are needed. Commands:
   
    node scripts/theme.mjs create DRAFT_DIR IMAGE RECIPE.json
    node scripts/theme.mjs update DRAFT_DIR REVISION PATCH.json
    node scripts/theme.mjs export DRAFT_DIR REVISION OUTPUT.gentletheme

DRAFT_DIR must not already exist for create. Example recipe (replace all regions with positions from the actual picture):
   
    {"name":"Reading lamp","bg":"#151421","text":"#fff4ea","accent":"#ffa37c","veil":0.4,"layers":[{"id":"lamp","preset":"lamp","intensity":0.5,"region":[[0.08,0.18],[0.13,0.18],[0.13,0.29],[0.08,0.29]]}]}

Coordinates run from 0 to 1 in the source image, measured from its upper left. Keep polygons simple and tight. At most 16 layers. Use a quiet veil for legible chat text. For an edit, patch only the requested values. Example: {"layers":{"lamp":{"intensity":0.2}}}. Set a layer to null to remove it. Use {"set":{"veil":0.5}} for a global change. Revision 1 is the original; updates write a new revision, export never overwrites existing files. Preserve the draft directory for future edits.

Return the absolute exported file path and revision. Use Desktop's theme Import or drop the exported file for native review. The person chooses whether to apply. Never put Desktop themes in Pi's theme folder. When no Desktop display is available, report export validation only; do not claim visual or performance verification.

## Guided scene direction

Inspect the user's actual picture once. Identify up to four visible candidates and the foreground objects that must stay still. Ask which object to animate, then offer only motions that fit that object, plus still or a freeform alternative. If the user already specified the objects and actions, proceed directly. Never assume a window or a face exists. Reuse the chosen regions for edits of this source only. Use `node scripts/theme.mjs suggest` to enumerate supported object types; e.g. `suggest window`. Map glass and water-on-glass to window, visible wisps to vapor. Explain when an object or action has no supported effect.

For wet glass, trace each unobstructed pane as a separate polygon; break complex regions into convex pieces and exclude faces, mullions and room furnishings. The wet-glass preset includes distant rain and merging/sliding foreground drops. Avoid adding rain over it twice.

For new scenes use the registered theme_motion_layer tool to validate and return one procedural layer per selected object; insert the returned layers into the recipe for create/update/export. If the host lacks extension tools, use the same recipe via the compiler. For a blink choose lid-rig, trace one eye per layer, and measure 3–24 left-to-right [normalized x, upper y, lower y, upper-skin hex, lower-skin hex, lash hex] cross-sections. Sample nearby unobstructed skin in the same illumination and ink at the lash. Keep hair and brows outside the strips. Both eyes share the clock. New procedural themes use only the source; do not generate a second image. Legacy blink/paint recipes remain readable. Inspect open, fully closed and reopened frames. Preserve the original and previous revisions.

For a full-resolution, closed-eye review run `python scripts/lid-frame.py ORIGINAL RECIPE NEW.png`. This uses the procedural renderer and Pillow only. Inspect the crop; if skin or lashes look wrong, adjust sampled colors or guides, not the whole picture.

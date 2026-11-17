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

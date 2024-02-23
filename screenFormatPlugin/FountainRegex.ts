export const SCENE_HEADER_PATTERN = /(?:\n|^)((int|ext|est|i\.?\/e\.?|e\.?\/i\.?)($|\s|\.|\-))/gi;
export const SCENE_NUMBER_PATTERN = /^\s*\#?[0-9][a-z0-9\.\-\(\)]*\s*$/;

export const TRANSITION_PATTERN = /(?:\n|^)(?:FADE|CUT|TRANSITION)\s*(?:TO\s*)?(?:[^<>\na-z]*):$/;

export const CHARACTER_PATTERN = /^[A-Z0-9][A-Z0-9\s\_\-\(\)\.]{2,}\:?$/;

export const PARENTHETICAL_PATTERN = /^\s*\(/;

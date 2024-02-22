export const SCENE_HEADER_PATTERN = /(?:\n|^)((int|ext|est|i\.?\/e\.?|e\.?\/i\.?)($|\s|\.))/gi;

export const TRANSITION_PATTERN = /(?:\n|^)(?:FADE|CUT|TRANSITION)\s*(?:TO\s*)?(?:[^<>\na-z]*):$/;

export const CHARACTER_PATTERN = /^[A-Z0-9][A-Z0-9\s\_\-\(\)\.]{2,}\:?$/;

export const PARENTHETICAL_PATTERN = /^\s*\(/;

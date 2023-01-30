export const timePattern = (group = null) => `\\[(?${group ? `<${group}>` : ':'}\\d{2}:\\d{2}(?::\\d{2})?)]`;
export const namePattern = (group = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9-]+)`;
export const pokemonNamePattern = (group = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9- '.é♂♀]+)`;
export const worldPattern = () => `(?:\\[(?<world>.*):\\s(?<x>[0-9-]+)\\s(?<y>[0-9-]+)\\s(?<z>[0-9-]+)]\\s?)?`;

// Cannot be import - package.json is at root level after running `tsc`
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

export const getVersion = (): string => version;

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["./src/", "./__test__"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{js,jsx,ts}"],
  coverageDirectory: "./__test__/coverage",
  coverageReporters: ["json-summary"]
};

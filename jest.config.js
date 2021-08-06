module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["./src/", "./__test__"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts}"],
  coverageDirectory: "./coverage/",
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "adapter-contracts",
      testMatch: ["<rootDir>/tests/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.base.json" }],
      },
      moduleNameMapper: {
        "^@omni-remote/(.*)$": "<rootDir>/packages/$1/src",
      },
    },
  ],
};

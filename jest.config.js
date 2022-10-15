module.exports = {
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node', 'd.ts'],
    collectCoverage: true,
    collectCoverageFrom: [
        "bin/**/*.{js,jsx,ts,tsx}",
        "!bin/**/*.d.ts"
    ],
};

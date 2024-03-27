module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
        'react-native-reanimated/plugin', {
            relativeSourceLocation: true,
        },
    ],
    [
        "module:react-native-dotenv", {
            "moduleName": "@dotenv",
            "path": ".env",
            "blacklist": null,
            "whitelist": null,
            "safe": false,
            "allowUndefined": false
        }]
],
};

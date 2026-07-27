module.exports = {
  project: {
    ios: {
      sourceDir: 'ios',
      automaticPodsInstallation: true,
    },
    android: {},
  },
  dependencies: {
    // iOS native network discovery module
    'react-native-local-network-discovery': {
      root: __dirname,
      platforms: {
        ios: {
          podspecPath: './native-modules/ios/RNLocalNetworkDiscovery/RNLocalNetworkDiscovery.podspec',
        },
      },
    },
  },
  assets: ['./assets/fonts/', './assets/sounds/'],
};

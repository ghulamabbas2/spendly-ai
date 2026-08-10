import 'react-native-gesture-handler/jestSetup';

// AsyncStorage's native module is null under Jest; use its official mock so the
// Supabase client (which persists sessions there) works in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest').default,
);

// react-native-bootsplash calls into a native TurboModule that doesn't exist in
// the Jest environment; stub it so screens importing it can render under test.
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  show: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn(),
}));

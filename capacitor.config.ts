import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'monteApp',
  webDir: 'dist',
  plugins: {
    Microphone: {
      permissions: ['android.permission.RECORD_AUDIO'],
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
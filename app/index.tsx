import { Redirect } from 'expo-router';

// UI-only entry point — always opens on the onboarding carousel. There is no
// real auth/session state in this project, so nothing gates access to the tabs.
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}

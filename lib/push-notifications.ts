import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request permission and return the push token (or null on failure / simulator). */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // push not supported on web

  const { status: existing } = await Notifications.getPermissionsAsync();
  const finalStatus = existing === 'granted'
    ? existing
    : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? undefined,
    });
    return token.data;
  } catch {
    return null;
  }
}

/** Send a push notification to a child's push token via Expo Push API.
 *  Called from parent device on challenge approval. */
export async function sendApprovalPush({
  pushToken,
  parentName,
  challengeTitle,
  gems,
}: {
  pushToken: string;
  parentName: string;
  challengeTitle: string;
  gems: number;
}) {
  const message = {
    to: pushToken,
    sound: 'default',
    title: `🎉 ${parentName} approved your challenge!`,
    body: `${challengeTitle} — you earned ${gems} 💎 gems!`,
    data: { type: 'approval' },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (e) {
    // Best-effort — non-fatal if push fails
    console.warn('Push notification failed:', e);
  }
}

/** Send a push notification to a child when a parent fulfils their reward redemption. */
export async function sendRewardFulfilledPush({
  pushToken,
  parentName,
  rewardTitle,
}: {
  pushToken: string;
  parentName: string;
  rewardTitle: string;
}) {
  const message = {
    to: pushToken,
    sound: 'default',
    title: `🎁 Your reward is ready!`,
    body: `${parentName} has fulfilled "${rewardTitle}" — go enjoy it! 🎉`,
    data: { type: 'reward_fulfilled' },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.warn('Push notification failed:', e);
  }
}

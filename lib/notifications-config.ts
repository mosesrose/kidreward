import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function configureNotificationChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('parent-actions', {
    name: 'Action Required',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    description: 'Challenge approvals and reward requests needing your attention',
  });

  await Notifications.setNotificationChannelAsync('parent-info', {
    name: 'Family Updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    description: 'Family joins, reminders, and general updates',
  });

  await Notifications.setNotificationChannelAsync('child-progress', {
    name: 'Your Progress',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    description: 'Challenge approvals and reward fulfilments',
  });

  await Notifications.setNotificationChannelAsync('child-nudge', {
    name: 'Friendly Reminders',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'default',
    description: 'Streak reminders and activity nudges',
  });
}

export const FUNNY_STREAK_QUOTES = [
  "🦥 Even sloths do their chores eventually… just saying!",
  "🎮 Pause the game, do a challenge, unpause. Easy!",
  "🐢 The tortoise finished his tasks. Don't be shown up by a tortoise.",
  "⚡ Your gems are getting lonely — go earn some!",
  "🌟 You've been on a roll! Don't let today be the day you stop.",
  "🚀 Heroes don't take days off. Well, sometimes. But not today!",
  "🦸 Your streak is calling. It would be sad to see it go.",
  "🍕 Challenges first, then pizza. That's the rule.",
];

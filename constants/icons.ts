// MaterialCommunityIcons names for challenge and reward card icons.
// These are stored in the `emoji` column of the challenges / rewards tables.

export type IconName = string;

export const CHALLENGE_ICONS: { name: IconName; label: string }[] = [
  { name: 'broom',                    label: 'Chores'       },
  { name: 'book-open-variant',        label: 'Homework'     },
  { name: 'tree',                     label: 'Outdoor'      },
  { name: 'account-group',            label: 'Family'       },
  { name: 'weather-sunny',            label: 'Morning'      },
  { name: 'hand-heart',               label: 'Kindness'     },
  { name: 'calculator',               label: 'Math'         },
  { name: 'bed',                      label: 'Room'         },
  { name: 'flower',                   label: 'Garden'       },
  { name: 'silverware-fork-knife',    label: 'Cooking'      },
  { name: 'human-male-female-child',  label: 'Siblings'     },
  { name: 'emoticon-happy-outline',   label: 'Behaviour'    },
  { name: 'cellphone-off',            label: 'Screen time'  },
  { name: 'run',                      label: 'Exercise'     },
  { name: 'star-outline',             label: 'Other'        },
];

export const REWARD_ICONS: { name: IconName; label: string }[] = [
  { name: 'cash',                     label: 'Money'        },
  { name: 'gift-outline',             label: 'Gift'         },
  { name: 'television-play',          label: 'Screen time'  },
  { name: 'bike',                     label: 'Activity'     },
  { name: 'ice-cream',                label: 'Treat'        },
  { name: 'gamepad-variant-outline',  label: 'Gaming'       },
  { name: 'movie-open-outline',       label: 'Movie'        },
  { name: 'food',                     label: 'Food'         },
  { name: 'pizza',                    label: 'Pizza'        },
  { name: 'shopping-outline',         label: 'Shopping'     },
  { name: 'star-outline',             label: 'Other'        },
];

// Fallback icon when a stored name can't be matched
export const FALLBACK_ICON: IconName = 'star-outline';

// MaterialIcons (Google Material Symbols) names for challenge and reward card icons.
// These are stored in the `emoji` column of the challenges / rewards tables.

export type IconName = string;

export const CHALLENGE_ICONS: { name: IconName; label: string }[] = [
  { name: 'cleaning-services',        label: 'Chores'       },
  { name: 'menu-book',                label: 'Homework'     },
  { name: 'park',                     label: 'Outdoor'      },
  { name: 'family-restroom',          label: 'Family'       },
  { name: 'wb-sunny',                 label: 'Morning'      },
  { name: 'volunteer-activism',       label: 'Kindness'     },
  { name: 'functions',                label: 'Math'         },
  { name: 'bed',                      label: 'Room'         },
  { name: 'local-florist',            label: 'Garden'       },
  { name: 'restaurant',               label: 'Cooking'      },
  { name: 'people',                   label: 'Social'       },
  { name: 'sentiment-satisfied',      label: 'Behaviour'    },
  { name: 'smartphone',               label: 'Screen time'  },
  { name: 'directions-run',           label: 'Exercise'     },
  { name: 'star-border',              label: 'Other'        },
];

export const REWARD_ICONS: { name: IconName; label: string }[] = [
  { name: 'payments',                 label: 'Money'        },
  { name: 'card-giftcard',            label: 'Gift'         },
  { name: 'tv',                       label: 'Screen time'  },
  { name: 'directions-bike',          label: 'Activity'     },
  { name: 'icecream',                 label: 'Treat'        },
  { name: 'videogame-asset',          label: 'Gaming'       },
  { name: 'movie',                    label: 'Movie'        },
  { name: 'fastfood',                 label: 'Food'         },
  { name: 'local-pizza',              label: 'Pizza'        },
  { name: 'shopping-bag',             label: 'Shopping'     },
  { name: 'star-border',              label: 'Other'        },
];

// Fallback icon when a stored name can't be matched
export const FALLBACK_ICON: IconName = 'star-border';

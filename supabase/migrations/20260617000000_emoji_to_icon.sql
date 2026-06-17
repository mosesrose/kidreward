-- Convert emoji characters in challenges.emoji and rewards.emoji
-- to MaterialCommunityIcons name strings.
-- Unrecognised values fall back to 'star-outline'.

update public.challenges
set emoji = case emoji
  when '📵' then 'cellphone-off'
  when '🌳' then 'tree'
  when '👫' then 'account-group'
  when '👨‍👩‍👧‍👦' then 'account-group'
  when '🌅' then 'weather-sunny'
  when '🤝' then 'hand-heart'
  when '🧹' then 'broom'
  when '🛏️' then 'bed'
  when '🌱' then 'flower'
  when '🍳' then 'silverware-fork-knife'
  when '🔢' then 'calculator'
  when '📚' then 'book-open-variant'
  when '✅' then 'book-open-variant'
  when '😌' then 'emoticon-happy-outline'
  when '⭐' then 'star-outline'
  else 'star-outline'
end
where emoji not like '%-%';   -- skip rows already migrated (icon names contain hyphens)

update public.rewards
set emoji = case emoji
  when '💵' then 'cash'
  when '💰' then 'cash'
  when '🎁' then 'gift-outline'
  when '📱' then 'television-play'
  when '🎡' then 'bike'
  when '🚲' then 'bike'
  when '🍦' then 'ice-cream'
  when '🎮' then 'gamepad-variant-outline'
  when '🎬' then 'movie-open-outline'
  when '🌳' then 'bike'
  when '🧸' then 'gift-outline'
  when '🍕' then 'pizza'
  else 'gift-outline'
end
where emoji not like '%-%';

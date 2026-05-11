// Content for DOLCE — meeting situation cards, Still Moment question pairs,
// and Transit statements.

// Meeting situation cards — one-line prompts shown at the top of a meeting.
const MEETING_SITUATIONS = [
  "Someone just walked out of the room mid-conversation.",
  "The person next to you hasn't moved in three minutes.",
  "You're in a meeting that should have ended an hour ago.",
  "Someone keeps checking their phone but denies it.",
  "The door closed behind you and you don't remember it opening.",
  "Everyone is looking at their laptops. No one is working.",
  "You were mid-sentence. No one reacted.",
  "The agenda was sent twice. Nobody acknowledged either.",
  "Someone said 'quick question' forty minutes ago.",
  "The clock is on the wrong wall now.",
  "You're being asked for your opinion. You don't have one.",
  "There's a silence that feels like it belongs to someone.",
  "You were told this would only take a minute. It's been nine.",
  "Someone just said your name. You don't know in what context.",
  "The lights dimmed and no one mentioned it.",
  "Your reflection took half a second too long to move.",
  "Someone laughed. The joke was three minutes ago.",
  "There are seven cups on the table and five people.",
  "Your coffee is cold and you don't remember it being hot.",
  "Someone said 'as we all agreed' — you didn't agree to that.",
  "Two of you are wearing the exact same shirt.",
  "The window has been open the whole time. It is winter.",
  "An empty chair is angled like someone just got up.",
  "Your phone is ringing. The screen says it's you.",
  "Someone is humming a song that hasn't been written.",
  "You've checked your watch four times. It's the same time.",
  "Half the room is whispering. The other half is too still.",
  "The plant on the table wasn't there an hour ago.",
  "You realize you've been holding the same breath.",
  "Someone said 'remember when?' and nobody did."
];

// Still Moment question pairs.
// Seeker question leans inward / vulnerable.
// Distraction question leans outward / surface / self-presenting.
// The off-key tonality is what sharp players can catch.
const STILL_MOMENTS = [
  { seeker: "What are you most afraid of right now?",       distraction: "What's the most impressive thing about you?" },
  { seeker: "What are you avoiding?",                        distraction: "What are you proud of?" },
  { seeker: "What do you actually want?",                    distraction: "What should you want?" },
  { seeker: "What were you just thinking about?",            distraction: "What should you be thinking about?" },
  { seeker: "What would you never say out loud?",            distraction: "What do you tell everyone?" },
  { seeker: "What are you tired of?",                        distraction: "What excites you?" },
  { seeker: "What's hurting right now?",                     distraction: "What feels good right now?" },
  { seeker: "What are you hiding?",                          distraction: "What are you showing?" },
  { seeker: "What's the last thing you lied about?",         distraction: "What's the last thing you were honest about?" },
  { seeker: "Who do you miss?",                              distraction: "Who admires you?" },
  { seeker: "What's the worst thing about today?",           distraction: "What's the best thing about today?" },
  { seeker: "What do you regret?",                           distraction: "What are you planning?" },
  { seeker: "What are you pretending not to notice?",        distraction: "What did you notice first?" },
  { seeker: "What keeps you up at night?",                   distraction: "What gets you out of bed?" },
  { seeker: "What have you stopped telling people?",         distraction: "What do you always mention?" },
  { seeker: "What's the smallest version of you?",           distraction: "What's the biggest version of you?" },
  { seeker: "What feels too heavy to carry?",                distraction: "What can you lift easily?" },
  { seeker: "What were you when no one was watching?",       distraction: "What are you when everyone is?" },
  { seeker: "What's a sentence you couldn't finish?",        distraction: "What's a sentence you always say?" },
  { seeker: "What's the room you don't go into?",            distraction: "What's your favorite place?" },
  { seeker: "What's still bothering you?",                   distraction: "What did you settle today?" },
  { seeker: "What are you saving for nobody?",               distraction: "What are you planning to share?" },
  { seeker: "Who left without saying goodbye?",              distraction: "Who do you keep in touch with?" },
  { seeker: "What broke and you never fixed?",               distraction: "What did you build recently?" }
];

// Statements used in TRANSIT task. Players answer TRUE/FALSE about themselves.
// No right answer — the reward comes from matching the crowd majority.
const TRANSIT_STATEMENTS = [
  "You checked your phone in the last hour.",
  "You have been putting something off.",
  "You know what you should do next.",
  "You ate something today you didn't really want.",
  "You agreed with something today that you didn't agree with.",
  "You opened an app today for no reason.",
  "You thought about quitting something today.",
  "You said 'I'm fine' today and meant something else.",
  "You owe someone a reply right now.",
  "You were the last one to leave somewhere today.",
  "You feel behind on something.",
  "You did something today just because it was easy.",
  "You laughed at something that wasn't funny today.",
  "You drank water in the last two hours.",
  "You skipped a step on purpose this week.",
  "You apologized for something that wasn't your fault.",
  "You looked at someone too long today.",
  "You finished a thing you didn't mean to start.",
  "You almost said something then didn't.",
  "You know exactly where your keys are.",
  "You are sitting differently than you were ten minutes ago.",
  "You re-read a message before sending it today.",
  "You ignored a notification on purpose today.",
  "You can hear something right now you wish you couldn't."
];

module.exports = { MEETING_SITUATIONS, STILL_MOMENTS, TRANSIT_STATEMENTS };

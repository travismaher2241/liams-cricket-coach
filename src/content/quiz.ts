/**
 * Cricket IQ question bank.
 * Each concept has 2+ differently-worded variants so a concept answered
 * incorrectly can come back next week as a "new" question.
 */

export interface Variant {
  q: string;
  options: string[];
  answer: number;
  why: string;
  /** Other options that are also reasonable (tactics rarely have one answer). */
  alsoOk?: number[];
}

export interface Concept {
  id: string;
  level: number;
  topic: string;
  /** True when junior competitions often play modified rules. */
  junior?: boolean;
  variants: Variant[];
}

export const LEVEL_NAMES = [
  "The Foundations",
  "Understanding the Game",
  "Developing Game Awareness",
  "The Thinking Cricketer",
  "Tactical Awareness",
  "Advanced Cricket IQ",
  "The Complete Cricketer",
];

export function levelName(level: number) {
  if (level <= LEVEL_NAMES.length) return LEVEL_NAMES[level - 1];
  return `The Complete Cricketer ${level - LEVEL_NAMES.length + 1}`;
}

const C = (id: string, level: number, topic: string, variants: Variant[], junior?: boolean): Concept => ({
  id,
  level,
  topic,
  variants,
  junior,
});

export const CONCEPTS: Concept[] = [
  // ---------------- LEVEL 1: The Foundations ----------------
  C("balls-in-over", 1, "Laws", [
    { q: "How many legal balls are in an over?", options: ["4", "5", "6", "8"], answer: 2, why: "An over has six legal deliveries. Wides and no-balls don't count, so they get bowled again." },
    { q: "A bowler has bowled 5 legal balls. How many more to finish the over?", options: ["None", "1", "2", "3"], answer: 1, why: "Six legal balls make an over, so one more finishes it." },
  ]),
  C("players-per-team", 1, "Laws", [
    { q: "How many players are in a standard cricket team on the field?", options: ["9", "10", "11", "12"], answer: 2, why: "A standard team has 11 players. Junior teams sometimes play with different numbers." },
    { q: "In a standard match, how many fielders (including the bowler and keeper) does the fielding team have?", options: ["11", "10", "9", "13"], answer: 0, why: "All 11 players in the fielding team are on the field." },
  ]),
  C("boundary-four", 1, "Scoring", [
    { q: "The ball rolls along the ground over the boundary rope. How many runs?", options: ["2", "4", "6", "Depends how far"], answer: 1, why: "If the ball touches the ground before crossing the boundary, it's four runs." },
    { q: "A batter hits it, it bounces once and then goes over the rope. What's it worth?", options: ["Six", "Four", "One", "Nothing"], answer: 1, why: "Any bounce before the boundary makes it a four." },
  ]),
  C("boundary-six", 1, "Scoring", [
    { q: "The ball flies over the boundary without touching the ground. How many runs?", options: ["4", "5", "6", "8"], answer: 2, why: "Clearing the boundary on the full is six runs." },
    { q: "What do you need to do to score a six?", options: ["Run six times", "Hit it over the rope without it bouncing", "Hit the sight screen", "Hit it really hard along the ground"], answer: 1, why: "A six is when the ball clears the boundary on the full." },
  ]),
  C("bowled", 1, "Dismissals", [
    { q: "The ball hits the stumps and a bail falls off. What is this dismissal called?", options: ["LBW", "Caught", "Bowled", "Stumped"], answer: 2, why: "If the bowler's delivery breaks the wicket, the batter is bowled." },
    { q: "The ball clips the pad, then hits the stumps and the bails fall. How is the batter out?", options: ["Bowled", "LBW", "Not out", "Hit wicket"], answer: 0, why: "It's still bowled, even if it touches the bat or body first." },
  ]),
  C("caught", 1, "Dismissals", [
    { q: "The batter hits the ball in the air and a fielder catches it before it bounces. What's the dismissal?", options: ["Caught", "Run out", "Bowled", "Not out"], answer: 0, why: "A clean catch before the ball bounces is caught." },
    { q: "A fielder catches the ball after it bounced once. Is the batter out?", options: ["Yes, caught", "No, it bounced first", "Only if the umpire says so", "Yes, run out"], answer: 1, why: "A catch only counts if the ball hasn't touched the ground." },
  ]),
  C("run-out", 1, "Dismissals", [
    { q: "The batters are running and the wicket is broken before a batter makes their ground. What is it called?", options: ["Stumped", "Run out", "Caught", "Hit wicket"], answer: 1, why: "If a batter isn't behind the crease when the wicket is broken while running, it's a run out." },
    { q: "To be safe when running, what must touch the ground behind the crease?", options: ["Your bat or a body part", "Only your helmet", "Your gloves in the air", "Nothing, you just need to be close"], answer: 0, why: "Ground your bat (held in your hand) or part of your body behind the line." },
  ]),
  C("wide", 1, "Extras", [
    { q: "The ball goes way past the batter, out of reach. What does the umpire call?", options: ["No-ball", "Wide", "Bye", "Dead ball"], answer: 1, why: "A delivery too wide for the batter to reach is a wide." },
    { q: "What signal does an umpire make for a wide?", options: ["One arm straight up", "Both arms straight out sideways", "Tap the shoulder", "Wave one arm"], answer: 1, why: "Both arms held out sideways means wide." },
  ]),
  C("no-ball", 1, "Extras", [
    { q: "A bowler's front foot lands completely over the popping crease. What's called?", options: ["Wide", "No-ball", "Dead ball", "Leg bye"], answer: 1, why: "Some part of the front foot must be behind the popping crease, or it's a no-ball." },
    { q: "Does a no-ball count as one of the six balls in the over?", options: ["Yes", "No, it gets bowled again", "Only in the last over", "Only if the batter hits it"], answer: 1, why: "No-balls aren't legal deliveries, so they're bowled again." },
  ]),
  C("pitch-length", 1, "Terminology", [
    { q: "What do we call the strip in the middle where the bowler bowls?", options: ["The pitch", "The outfield", "The crease", "The boundary"], answer: 0, why: "The pitch is the 22-yard strip between the wickets." },
    { q: "In a standard match, how long is the pitch between the stumps?", options: ["11 yards", "18 yards", "22 yards", "30 yards"], answer: 2, why: "A full-size pitch is 22 yards. Junior pitches are often shorter.", }
  ], true),
  C("stumps-bails", 1, "Terminology", [
    { q: "How many stumps are at each end?", options: ["2", "3", "4", "1"], answer: 1, why: "Three stumps with two bails on top make each wicket." },
    { q: "What sits on top of the stumps?", options: ["Bails", "Caps", "Pins", "Rings"], answer: 0, why: "Two bails sit on top of the three stumps." },
  ]),
  C("crease", 1, "Terminology", [
    { q: "What is the line the batter stands behind called?", options: ["The popping crease", "The boundary", "The return crease", "The edge"], answer: 0, why: "The popping crease is the batting crease. Stay behind it to be safe." },
    { q: "Where should the batter's bat be to be 'in their ground'?", options: ["Behind the popping crease", "On the stumps", "Anywhere on the pitch", "Above the crease in the air"], answer: 0, why: "The bat or a body part must be grounded behind the popping crease." },
  ]),
  C("keeper", 1, "Fielding", [
    { q: "Which fielder stands behind the stumps wearing gloves?", options: ["Slip", "Wicketkeeper", "Gully", "Mid-on"], answer: 1, why: "The wicketkeeper stands behind the stumps and wears gloves and pads." },
    { q: "Which player is allowed to wear big gloves in the field?", options: ["The captain", "The bowler", "The wicketkeeper", "Every fielder"], answer: 2, why: "Only the wicketkeeper wears gloves." },
  ]),
  C("umpire-out", 1, "Laws", [
    { q: "How does an umpire show the batter is out?", options: ["Raises one finger", "Waves both arms", "Taps head", "Points at the boundary"], answer: 0, why: "A raised index finger means out." },
    { q: "Who makes the final decision on whether a batter is out in a match?", options: ["The bowler", "The umpire", "The captain", "The crowd"], answer: 1, why: "The umpire decides. Players accept the decision, that's good sportsmanship." },
  ]),
  C("helmet-safety", 1, "Safety", [
    { q: "Why do batters wear a helmet facing a hard ball?", options: ["It looks cool", "To protect their head", "It's warmer", "To see better"], answer: 1, why: "Helmets protect your head. Every top player wears one." },
    { q: "What should you wear when batting against a hard ball?", options: ["Helmet, pads, gloves and a box", "Just a cap", "Only gloves", "Sunglasses"], answer: 0, why: "Proper protective gear keeps you safe and helps you play with confidence." },
  ]),
  C("ducks", 1, "Terminology", [
    { q: "What is it called when a batter gets out for zero?", options: ["A goose", "A duck", "A zero", "A blank"], answer: 1, why: "Out for 0 is a 'duck'. Every great batter has made ducks, it's part of cricket." },
    { q: "A batter made 0 but wasn't out. Is it a duck?", options: ["Yes", "No, you have to be out for it to be a duck", "Only in Tests", "Only if they faced one ball"], answer: 1, why: "A duck is only when you're out for 0. Zero not out is not a duck." },
  ]),
  C("maiden", 1, "Terminology", [
    { q: "What is an over with no runs scored off it called?", options: ["A clean over", "A maiden", "A dot over", "A perfect over"], answer: 1, why: "An over with no runs conceded is a maiden over." },
    { q: "A bowler bowls six balls and the batters score nothing. What did they bowl?", options: ["A hat-trick", "A maiden", "A wide", "A duck"], answer: 1, why: "No runs in the over = a maiden." },
  ]),
  C("toss", 1, "Laws", [
    { q: "How is it decided who bats first?", options: ["A coin toss", "The tallest captain", "The home team always bats", "The umpire picks"], answer: 0, why: "The captains toss a coin, and the winner chooses to bat or bowl." },
    { q: "The captain who wins the toss gets to...", options: ["Choose to bat or bowl first", "Pick the umpire", "Have an extra player", "Choose the ball colour"], answer: 0, why: "Winning the toss lets you choose to bat or bowl first." },
  ]),
  C("straight-bat", 1, "Batting", [
    { q: "For a forward defence, where should your head be?", options: ["Over the ball, near the front knee", "Leaning back", "Looking at the fielders", "Away from the ball"], answer: 0, why: "Head over the ball gives you balance and control." },
    { q: "When playing a defensive shot, what should the bat face do?", options: ["Point straight back down the pitch", "Point to the sky", "Face the keeper", "Face the slips"], answer: 0, why: "A straight bat face gives you the best chance of meeting the ball." },
  ]),
  C("watch-ball", 1, "Batting", [
    { q: "What's the most important thing to do when batting?", options: ["Watch the ball", "Look at the fielders", "Swing as hard as you can", "Close your eyes"], answer: 0, why: "Watching the ball from the bowler's hand helps every other part of batting." },
    { q: "When should you start watching the ball as a batter?", options: ["When it bounces", "From the bowler's hand", "When it reaches you", "After you hit it"], answer: 1, why: "Picking it up from the bowler's hand gives you the most time." },
  ]),
  C("ready-position", 1, "Fielding", [
    { q: "What should a fielder do as the bowler runs in?", options: ["Walk in on their toes, ready", "Sit down", "Look at the crowd", "Stand with hands in pockets"], answer: 0, why: "Walking in ready means you can react fast." },
    { q: "A good 'ready position' for a fielder looks like...", options: ["Knees bent, weight forward, hands ready", "Standing straight, arms crossed", "Leaning back", "Turned away from the batter"], answer: 0, why: "Bent knees and weight forward let you move quickly in any direction." },
  ]),
  C("follow-through", 1, "Bowling", [
    { q: "What should a bowler do after releasing the ball?", options: ["Follow through towards the target", "Stop dead", "Turn around immediately", "Sit down"], answer: 0, why: "A full follow-through helps accuracy and protects your body." },
    { q: "Why is a good follow-through important?", options: ["It helps accuracy and protects your back", "It makes you look taller", "It's against the rules", "It isn't important"], answer: 0, why: "Following through spreads the effort safely and keeps the ball on line." },
  ]),

  // ---------------- LEVEL 2: Understanding the Game ----------------
  C("lbw-basic", 2, "Dismissals", [
    { q: "LBW stands for...", options: ["Leg Before Wicket", "Long Ball Wide", "Left Behind Wicket", "Low Bounce Wicket"], answer: 0, why: "LBW = Leg Before Wicket." },
    { q: "In LBW, which part usually stops the ball from hitting the stumps?", options: ["The bat", "The batter's pad/leg", "The keeper's gloves", "The helmet"], answer: 1, why: "If the ball would have hit the stumps but your leg/pad got in the way, it may be LBW." },
  ], true),
  C("stumped", 2, "Dismissals", [
    { q: "The batter steps out, misses, and the keeper breaks the wicket. What's this?", options: ["Run out", "Stumped", "Hit wicket", "Bowled"], answer: 1, why: "Stumped is when the keeper breaks the wicket while the batter is out of the crease and not running." },
    { q: "Which fielder makes a stumping?", options: ["Slip", "The bowler", "Wicketkeeper", "Cover"], answer: 2, why: "Only the wicketkeeper can make a stumping." },
  ]),
  C("bye-legbye", 2, "Extras", [
    { q: "The ball misses everything and the batters run 1. What is that run?", options: ["Bye", "Wide", "Leg bye", "No-ball"], answer: 0, why: "A run when the ball doesn't touch the bat or body is a bye." },
    { q: "The ball hits the batter's pad and they run 1. What is it?", options: ["Bye", "Leg bye", "Wide", "Run to the batter"], answer: 1, why: "Runs off the body (not the bat) are leg byes, as long as the batter tried to play a shot or get out of the way." },
  ]),
  C("good-length", 2, "Bowling", [
    { q: "What is a 'good length' ball?", options: ["Pitches where the batter is unsure to go forward or back", "Bounces right at the batter's feet", "Doesn't bounce at all", "Bounces halfway down the pitch"], answer: 0, why: "A good length makes the batter unsure whether to play forward or back." },
    { q: "Why do coaches love a 'good length'?", options: ["It makes the batter hesitate", "It's the fastest ball", "It always gets wickets", "It's easiest to hit"], answer: 0, why: "Hesitation leads to mistakes, so a good length puts the batter under pressure." },
  ]),
  C("full-short", 2, "Batting", [
    { q: "The ball is pitched up near your feet. Usually you should go...", options: ["Forward", "Back", "Sideways away", "Nowhere"], answer: 0, why: "Full balls are usually played on the front foot." },
    { q: "The ball is short and bouncing up. Usually you should go...", options: ["Forward", "Back", "Run down the pitch", "Kneel"], answer: 1, why: "Short balls give you time to go back and play." },
  ]),
  C("yorker", 2, "Bowling", [
    { q: "A ball that lands right at the batter's toes is called a...", options: ["Bouncer", "Yorker", "Googly", "Half-volley"], answer: 1, why: "A yorker lands at the base of the stumps or the batter's toes. Hard to hit!" },
    { q: "Why is a yorker hard to score off?", options: ["It lands under the bat", "It's always slow", "It bounces too high", "It's a wide"], answer: 0, why: "It lands so full it's hard to get the bat under it." },
  ]),
  C("fielding-sides", 2, "Fielding positions", [
    { q: "For a right-handed batter, the 'off side' is...", options: ["The side their bat faces", "The side behind their legs", "Behind the keeper", "The bowler's end"], answer: 0, why: "Off side is the side the batter faces when in their stance. The other side is the leg (on) side." },
    { q: "For a left-hander, which side is the leg side?", options: ["The side behind their legs", "The side the bat faces", "Always the left", "The keeper's side"], answer: 0, why: "Leg side is behind the batter's legs. It flips for left-handers." },
  ]),
  C("slips", 2, "Fielding positions", [
    { q: "Where do slip fielders stand?", options: ["Next to the keeper, waiting for edges", "On the boundary", "Near the bowler", "In front of the batter"], answer: 0, why: "Slips stand beside the keeper to catch edges." },
    { q: "What are slips waiting for?", options: ["Outside edges off the bat", "Sixes", "Wides", "Run outs at the bowler's end"], answer: 0, why: "Slips are there to catch thin edges." },
  ]),
  C("mid-on-off", 2, "Fielding positions", [
    { q: "Mid-off stands...", options: ["Straight-ish on the off side near the bowler", "Behind the keeper", "At square leg", "On the boundary behind the batter"], answer: 0, why: "Mid-off and mid-on stand either side of the bowler, saving singles." },
    { q: "Which fielder stands on the leg side near the bowler?", options: ["Mid-on", "Point", "Gully", "Third man"], answer: 0, why: "Mid-on is the leg side partner of mid-off." },
  ]),
  C("backing-up", 2, "Fielding", [
    { q: "Why does a fielder run behind the stumps when the ball is thrown in?", options: ["To back up and stop overthrows", "To talk to the keeper", "They're lost", "To get a drink"], answer: 0, why: "Backing up stops the ball running away for extra runs." },
    { q: "The ball's thrown to the bowler's end. What should the nearest fielder do?", options: ["Back up behind the stumps", "Stand still", "Clap", "Run to the boundary"], answer: 0, why: "Backing up saves overthrows and helps your team." },
  ]),
  C("calling", 2, "Batting", [
    { q: "What are the three main calls when running between wickets?", options: ["Yes, No, Wait", "Go, Stop, Run", "Left, Right, Up", "One, Two, Three"], answer: 0, why: "Clear calls of 'Yes', 'No' or 'Wait' prevent run outs." },
    { q: "Who usually calls for a run if the ball goes in front of the wicket?", options: ["The striker (who hit it)", "The non-striker", "The umpire", "The keeper"], answer: 0, why: "The striker calls when the ball is in front, because they can see it." },
  ]),
  C("non-striker-backup", 2, "Batting", [
    { q: "What should the non-striker do as the bowler bowls?", options: ["Back up a little, bat grounded", "Stand way behind the crease", "Sit down", "Run immediately"], answer: 0, why: "Backing up a step (while the bowler lets go) makes quick singles possible." },
    { q: "When is it safe for the non-striker to leave the crease?", options: ["Once the bowler has released the ball", "Before the bowler runs in", "Any time", "Never"], answer: 0, why: "Wait until the ball is released, or you could be run out by the bowler." },
  ]),
  C("retirement", 2, "Junior rules", [
    { q: "In many junior competitions, a batter must retire after reaching a set score. Why?", options: ["So more kids get a bat", "As a punishment", "Because they're tired", "To end the game"], answer: 0, why: "Retirement rules give everyone a chance to bat. Your competition sets the number." },
    { q: "If you 'retire' in junior cricket after reaching the limit, are you out?", options: ["No, you're retired not out", "Yes, it counts as out", "Only on Saturdays", "Only if you hit a six"], answer: 0, why: "Retiring is not getting out. It counts as not out in your stats." },
  ], true),
  C("strike-rotation", 2, "Batting", [
    { q: "What does 'rotating the strike' mean?", options: ["Taking singles so both batters face balls", "Swapping bats", "Hitting only sixes", "Changing ends after the innings"], answer: 0, why: "Taking singles keeps the scoreboard moving and puts pressure on bowlers." },
    { q: "Why are singles valuable?", options: ["They keep the score moving and frustrate bowlers", "They are worth more than fours", "They stop the over", "They're not valuable"], answer: 0, why: "Lots of singles add up fast, and bowlers can't settle." },
  ]),

  // ---------------- LEVEL 3: Developing Game Awareness ----------------
  C("swing-basic", 3, "Swing and seam", [
    { q: "What does it mean when a ball 'swings'?", options: ["It curves in the air", "It spins off the pitch", "It bounces twice", "It goes slower"], answer: 0, why: "Swing is movement in the air before the ball bounces." },
    { q: "Why do bowlers shine one side of the ball?", options: ["To help it swing", "To make it heavier", "Because it's dirty", "It's a rule"], answer: 0, why: "One shiny side and one rough side helps the ball swing in the air." },
  ]),
  C("seam-movement", 3, "Swing and seam", [
    { q: "'Seam movement' happens...", options: ["When the ball hits the pitch on the seam and changes direction", "In the air", "Only with spin bowlers", "After the batter hits it"], answer: 0, why: "Seam movement is sideways movement off the pitch after landing on the seam." },
    { q: "To get seam movement, a bowler tries to land the ball with the seam...", options: ["Upright", "Flat", "Hidden", "Facing the keeper"], answer: 0, why: "An upright seam is more likely to grip and deviate off the pitch." },
  ]),
  C("off-vs-leg-spin", 3, "Spin bowling", [
    { q: "A right-arm off-spinner turns the ball, to a right-hander, mostly...", options: ["From off side into the batter", "Away from the batter", "Straight up", "It doesn't turn"], answer: 0, why: "Off-spin turns from the off side towards the right-hander's legs." },
    { q: "A leg-spinner's stock ball to a right-hander turns...", options: ["Away from the batter towards the off side", "Into the batter", "Back to the bowler", "Straight"], answer: 0, why: "Leg-spin turns from leg to off for a right-hander." },
  ]),
  C("required-rate", 3, "Match situations", [
    { q: "You need 30 runs from 5 overs. What's the required run rate?", options: ["5 per over", "6 per over", "3 per over", "10 per over"], answer: 1, why: "30 ÷ 5 = 6 runs per over." },
    { q: "Your team needs 24 off 4 overs. How many per over?", options: ["4", "6", "8", "12"], answer: 1, why: "24 ÷ 4 = 6 runs per over." },
  ]),
  C("partnership", 3, "Batting strategies", [
    { q: "What is a partnership?", options: ["Runs scored by two batters together", "Two bowlers sharing an over", "A team chant", "Two fielders swapping"], answer: 0, why: "A partnership is the runs added while two batters are together." },
    { q: "After two quick wickets, a smart new batter usually...", options: ["Builds a partnership calmly", "Tries to hit a six first ball", "Runs every ball", "Retires"], answer: 0, why: "Rebuilding steadies the team. Though if runs are urgently needed, attacking can be right too.", alsoOk: [] },
  ]),
  C("power-play-field", 3, "Field placements", [
    { q: "A batter keeps hitting through cover. What might the captain do?", options: ["Move a fielder to cover or deep cover", "Take all fielders off", "Bowl underarm", "Change the ball"], answer: 0, why: "Captains move fielders to where the batter scores. It's a compliment to the batter!" },
    { q: "Why did the captain put a fielder on the boundary behind square leg?", options: ["The batter likes to pull short balls", "To shade from the sun", "Random", "To bowl next"], answer: 0, why: "Fields are set for a batter's favourite shots." },
  ]),
  C("dot-balls", 3, "Bowling strategies", [
    { q: "Why do bowlers love dot balls?", options: ["They build pressure on the batter", "They count as wickets", "They're worth bonus runs", "They end the over"], answer: 0, why: "Dot balls build pressure, and pressure can cause mistakes." },
    { q: "A batter is stuck on 0 after 10 balls. What's the bowler trying to do?", options: ["Build pressure so they take a risk", "Let them score", "Bowl wides", "Swap ends"], answer: 0, why: "Pressure from dot balls often leads to a rash shot." },
  ]),
  C("leave-ball", 3, "Shot selection", [
    { q: "The ball is well wide of off stump early in your innings. A good option is...", options: ["Leave it", "Slog it to leg", "Run down the pitch", "Fall over"], answer: 0, why: "Leaving balls you don't need to play is a real skill. Cutting a wide, short ball can be fine too.", alsoOk: [] },
    { q: "Why do good batters 'leave' some balls?", options: ["To avoid edging deliveries that can't hit the stumps", "Because they're scared", "It's a rule", "To waste time"], answer: 0, why: "Leaving well means you only play at balls you need to." },
  ]),
  C("bounce-pitch", 3, "Pitch conditions", [
    { q: "On a dry, cracked pitch late in a game, which bowlers often do well?", options: ["Spinners", "Only fast bowlers", "Nobody", "Wicketkeepers"], answer: 0, why: "Dry, worn pitches grip and help spin." },
    { q: "A green, grassy pitch usually helps...", options: ["Seam bowlers", "Spinners most", "Batters only", "Nobody"], answer: 0, why: "Grass helps the ball seam and bounce for pace bowlers." },
  ]),
  C("overcast", 3, "Weather conditions", [
    { q: "Cloudy, humid days often help which bowling?", options: ["Swing bowling", "Spin bowling only", "Underarm", "None"], answer: 0, why: "Overcast, humid conditions are often said to help swing." },
    { q: "It's cloudy and the ball is swinging. As a batter you might...", options: ["Be careful outside off stump", "Hit every ball in the air", "Bat with your eyes closed", "Switch hands"], answer: 0, why: "Swing makes edges more likely, so be selective outside off." },
  ]),

  // ---------------- LEVEL 4: The Thinking Cricketer ----------------
  C("lbw-pitching-leg", 4, "Laws", [
    { q: "Can a batter be LBW if the ball pitched outside leg stump?", options: ["No", "Yes", "Only if they played no shot", "Only to spinners"], answer: 0, why: "Under the Laws, a ball pitching outside leg stump can't give an LBW." },
    { q: "The ball lands outside the leg stump, hits the pad in line, and would hit the stumps. Out LBW?", options: ["Not out", "Out", "Dead ball", "Re-bowl"], answer: 0, why: "Pitching outside leg = not out LBW, no matter what happens next." },
  ]),
  C("economy", 4, "Statistics", [
    { q: "A bowler gives away 12 runs in 3 overs. What's their economy rate?", options: ["3", "4", "6", "12"], answer: 1, why: "Economy = runs ÷ overs = 12 ÷ 3 = 4." },
    { q: "Economy rate tells you...", options: ["Runs conceded per over", "Wickets per match", "Balls per wicket", "Speed of the ball"], answer: 0, why: "Economy rate is runs per over. Lower is better for bowlers." },
  ]),
  C("batting-average", 4, "Statistics", [
    { q: "You've scored 60 runs and been out 3 times. Your batting average is...", options: ["20", "30", "60", "15"], answer: 0, why: "Average = runs ÷ times out = 60 ÷ 3 = 20." },
    { q: "Why do not-outs help a batting average?", options: ["Runs count but there's no extra dismissal", "Not-outs count double", "They don't help", "They're removed"], answer: 0, why: "Average divides by dismissals, so not-out runs boost it." },
  ]),
  C("bowling-plan", 4, "Bowling strategies", [
    { q: "A batter keeps missing balls outside off stump. A smart plan is...", options: ["Keep bowling there with slips in", "Bowl at their pads", "Bowl bouncers", "Bowl wide"], answer: 0, why: "Keep testing a batter where they're uncomfortable." },
    { q: "A batter hits everything to the leg side. As bowler you might...", options: ["Bowl a tight line outside off stump", "Bowl at their legs", "Bowl full tosses", "Bowl slower each ball"], answer: 0, why: "Taking away their strength makes them play shots they're less comfortable with." },
  ]),
  C("run-chase-plan", 4, "Match situations", [
    { q: "Chasing 80 in 20 overs with plenty of wickets. A good approach is...", options: ["Steady singles and punish bad balls", "Hit every ball for six", "Block every ball", "Run on every ball"], answer: 0, why: "4 an over is achievable without big risks. Keep wickets in hand." },
    { q: "You need 2 an over with 8 wickets in hand. What's most important?", options: ["Don't lose wickets cheaply", "Hit sixes", "Score as fast as possible", "Retire"], answer: 0, why: "When the rate is easy, protecting wickets is the key." },
  ]),
  C("field-new-batter", 4, "Captaincy", [
    { q: "A new batter has just come in. Captains often...", options: ["Bring fielders in to attack", "Send everyone to the boundary", "Take the bowler off", "Call drinks"], answer: 0, why: "New batters are settling in, so attacking fields can create chances." },
    { q: "Why might a captain put a fielder close at short leg for a new batter?", options: ["To catch a nervous prod", "To distract them rudely", "Fielders like it", "It's compulsory"], answer: 0, why: "A close fielder can snap up a bat-pad catch." },
  ]),
  C("spirit", 4, "Sportsmanship", [
    { q: "The 'Spirit of Cricket' is about...", options: ["Respect for opponents, umpires and the game", "Winning at all costs", "Arguing with umpires", "Never walking"], answer: 0, why: "Cricket values respect and fair play." },
    { q: "Your teammate drops a catch. The best thing to say is...", options: ["'Next one!' and a clap", "'You lost us the game'", "Nothing, just glare", "'Give up'"], answer: 0, why: "Supporting teammates helps everyone play better." },
  ]),

  // ---------------- LEVEL 5: Tactical Awareness ----------------
  C("death-bowling", 5, "Bowling strategies", [
    { q: "In the last over, defending runs, a common plan is...", options: ["Yorkers and slower balls", "Half-volleys", "Short wides", "Full tosses"], answer: 0, why: "Yorkers and change-ups are hard to hit for boundaries." },
    { q: "Why do bowlers bowl slower balls at the end of an innings?", options: ["To upset the batter's timing", "Because they're tired", "To make them easier", "Rule requires it"], answer: 0, why: "A change of pace makes batters mistime big shots." },
  ]),
  C("protect-batter", 5, "Batting strategies", [
    { q: "Your partner is a tailender. Late in the over, you might...", options: ["Try to keep the strike", "Give them the strike", "Retire", "Leave every ball"], answer: 0, why: "Farming the strike protects a weaker batter." },
    { q: "'Farming the strike' means...", options: ["A batter takes most of the strike to protect a partner", "Batting on a farm", "Swapping every ball", "Scoring only fours"], answer: 0, why: "It's a tactic to keep the stronger batter facing." },
  ]),
  C("reading-wrist", 5, "Reading deliveries", [
    { q: "How can you pick a spinner's variation?", options: ["Watch the hand and wrist at release", "Watch the umpire", "Listen to the crowd", "Look at the keeper"], answer: 0, why: "The wrist and fingers give clues to which way it will turn." },
    { q: "You see the back of a leg-spinner's hand at release. It's likely a...", options: ["Googly", "Leg-break", "Yorker", "Bouncer"], answer: 0, why: "Showing the back of the hand often means the googly." },
  ]),
  C("field-defensive", 5, "Field placements", [
    { q: "Defending 10 off the last over, a captain usually...", options: ["Spreads the field to stop boundaries", "Brings everyone in", "Uses five slips", "Removes the keeper"], answer: 0, why: "Stopping fours and sixes matters most. Singles are fine." },
    { q: "Why might a captain give away singles late in an innings?", options: ["To stop boundaries", "To be nice", "To end quickly", "It's a rule"], answer: 0, why: "Singles hurt less than boundaries when defending a small total." },
  ]),

  // ---------------- LEVEL 6: Advanced Cricket IQ ----------------
  C("dls", 6, "Laws", [
    { q: "What does the DLS method do?", options: ["Sets fair targets when rain shortens a game", "Measures ball speed", "Picks the toss", "Decides LBWs"], answer: 0, why: "Duckworth-Lewis-Stern adjusts targets for interrupted games." },
    { q: "Rain cuts a chase short. What usually sets the new target in senior cricket?", options: ["The DLS method", "The home captain", "A coin toss", "The scorer guesses"], answer: 0, why: "DLS is used in most senior one-day games." },
  ]),
  C("reverse-swing", 6, "Swing and seam", [
    { q: "Reverse swing usually happens with...", options: ["An older, scuffed ball", "A brand new ball", "A wet ball", "Spin bowlers"], answer: 0, why: "Reverse swing typically appears with an older ball, often at pace." },
    { q: "A reverse-swinging ball moves...", options: ["Towards the shiny side", "Towards the rough side", "Doesn't move", "Only upwards"], answer: 0, why: "Conventional swing moves towards the rough side; reverse moves the other way." },
  ]),
  C("matchup", 6, "Captaincy", [
    { q: "A left-hander comes in. The captain brings on an off-spinner. Why?", options: ["Off-spin turns away from the left-hander", "It's random", "Rule says so", "To slow the game"], answer: 0, why: "Captains look for matchups where the ball moves away from the bat." },
    { q: "What's a bowling 'matchup'?", options: ["Choosing a bowler who suits a particular batter", "Two bowlers at once", "A bowling competition", "Swapping teams"], answer: 0, why: "Picking the right bowler for each batter is smart captaincy." },
  ]),

  // ---------------- LEVEL 7: The Complete Cricketer ----------------
  C("innings-pacing", 7, "Batting strategies", [
    { q: "In a 40-over game, when do teams often score fastest?", options: ["The last 10 overs, with wickets in hand", "The first over", "Overs 15 to 20 always", "Never"], answer: 0, why: "Saving wickets lets you accelerate at the end." },
    { q: "Why do batters 'build' an innings?", options: ["Getting set first makes attacking safer later", "To waste time", "Rules require it", "To tire the umpire"], answer: 0, why: "Once set, a batter can score faster with less risk." },
  ]),
  C("bowling-changes", 7, "Captaincy", [
    { q: "A partnership is building. The captain might...", options: ["Change the bowler or the field to break rhythm", "Do nothing forever", "Declare", "Leave the field"], answer: 0, why: "Fresh ideas can break a partnership." },
    { q: "Why do captains change ends for a bowler?", options: ["To use the wind or slope, or a better matchup", "Bowlers get bored", "It's random", "Umpire requests"], answer: 0, why: "Conditions like wind or slope can help certain bowlers." },
  ]),
];

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));

export const MAX_CONTENT_LEVEL = Math.max(...CONCEPTS.map((c) => c.level));

export interface QuizQuestion {
  /** conceptId#variantIndex */
  id: string;
  conceptId: string;
  topic: string;
  junior?: boolean;
  q: string;
  options: string[];
  answer: number;
  why: string;
  alsoOk?: number[];
}

export function questionFor(conceptId: string, variantIdx: number): QuizQuestion {
  const c = CONCEPT_BY_ID[conceptId];
  const v = c.variants[variantIdx % c.variants.length];
  return {
    id: `${conceptId}#${variantIdx % c.variants.length}`,
    conceptId,
    topic: c.topic,
    junior: c.junior,
    q: v.q,
    options: v.options,
    answer: v.answer,
    why: v.why,
    alsoOk: v.alsoOk,
  };
}

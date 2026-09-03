# WORD RUSH — MASTER GAME PLAN

> **Status:** Master specification / source of truth  
> **Purpose:** This file describes the complete agreed design of the WORD RUSH educational game. Codex should read this file before implementing or changing core game mechanics. Do not silently change the rules, grammar content, navigation, scoring, lives, or repeat logic described here.

---

## 1. GAME CONCEPT

**WORD RUSH** is an educational pseudo-3D arcade runner for practising English grammar.

The player controls a **skater viewed from behind and slightly above**. The skater continuously rides forward through a city environment. The player moves between **three lanes** and jumps over obstacles.

The important visual goal is that the player must feel that **the skater is genuinely travelling forward through an endless/continuous world**.

This must NOT look like:
- a static background with objects simply sliding toward a stationary character;
- one flat background image with obstacles moving on top of it.

Instead:
- new scenery, answer gates, stars, hearts and obstacles appear far ahead near the horizon;
- distant objects start small;
- as they approach, they become larger, move lower on the screen and spread outward according to their lane / world position;
- nearby objects pass the player and disappear;
- new scenery continuously appears in the distance;
- roadside scenery also participates in the perspective movement;
- the road and lane markings must reinforce forward motion;
- parallax / different apparent movement speeds should be used for distant and near scenery.

The skater itself stays approximately in the lower part of the screen, but has a looping riding animation.

---

# 2. OVERALL STRUCTURE

WORD RUSH contains **three independent mini-games**.

They are NOT sequential rounds of one game.

The student can choose **any of the three games at any time**, including on the first visit or on a later day.

No mini-game is locked.

### Mini-games

1. **NOW OR USUALLY?**  
   Present Simple vs Present Continuous

2. **PAST OR EXPERIENCE?**  
   Present Perfect vs Past Simple

3. **WHAT WAS HAPPENING?**  
   Past Simple vs Past Continuous

Each mini-game contains **15 grammar questions/sentences**.

---

# 3. NAVIGATION FLOW

## 3.1 Loading screen

Show a short loading screen while game assets load.

Example:

**WORD RUSH**  
`LOADING...`

A small skateboard wheel animation may be used.

---

## 3.2 Main HOME screen

The HOME screen is the cover of the entire game.

It contains:

- WORD RUSH title;
- subtitle/tagline, e.g. **Ride. Choose. Win.**
- large **PLAY** button;
- sound control;
- attractive city/skate visual.

Suggested layout:

**WORD RUSH**  
*Ride. Choose. Win.*

`PLAY`

The sound button must be accessible here.

---

## 3.3 CHOOSE YOUR GAME screen

Pressing PLAY opens the game-selection hub.

Show three large cards:

### NOW OR USUALLY?
Present Simple vs Present Continuous  
BEST: [saved best score]  
PLAY

### PAST OR EXPERIENCE?
Present Perfect vs Past Simple  
BEST: [saved best score]  
PLAY

### WHAT WAS HAPPENING?
Past Simple vs Past Continuous  
BEST: [saved best score]  
PLAY

All three are always available.

Also show:
- HOME/back control;
- sound control.

---

## 3.4 Mini-game intro screen

After selecting a mini-game, show a short intro before the run.

Example:

**NOW OR USUALLY?**  
Present Simple vs Present Continuous

**15 QUESTIONS**

Choose the correct answer.  
Dodge obstacles and collect stars!

Controls:

`← →` MOVE  
`↑ / SPACE` JUMP

Show:
- Start with 3 lives;
- Collect stars for points;
- Find extra lives.

Button:

**START RIDE**

---

## 3.5 Countdown

After START RIDE:

**3 — 2 — 1 — GO!**

The run begins.

The first few seconds should contain only simple gameplay so the player can settle into the controls before Question 1 appears.

---

# 4. PLAYER / SKATER

Use one main skater asset/animation.

## Camera

The skater is viewed:
- from behind;
- slightly from above;
- riding away from the camera.

## Animation

Use one looping animated GIF (or equivalent sprite animation) showing the skater:
- riding;
- periodically pushing with one foot;
- balancing naturally.

The same animation may be used throughout the run.

Do NOT require separate character artwork for left/right movement.

### Lane movement

When the player presses left/right:
- move the same animated skater smoothly between the three lane positions.

### Jump

A separate jump animation is not required initially.

Jump can be created by code:
- raise the skater vertically;
- optionally add a slight scale/rotation/tilt;
- return smoothly to the road.

### Collision

A separate fall animation is not required initially.

Collision feedback may use:
- screen shake;
- skater shake/tilt;
- short flash;
- collision sound;
- temporary invulnerability.

---

# 5. CONTROLS

Desktop controls:

- `←` = move one lane left
- `→` = move one lane right
- `↑` or `SPACE` = jump
- Pause button = pause game

The game has **three lanes**.

Movement between lanes should be smooth rather than instant teleportation.

---

# 6. SHARED RUNNER WORLD

All three mini-games use the same underlying runner engine.

The visual theme changes between games, but the mechanics remain shared.

## Game 1 environment

### SKATE PARK DISTRICT
Daytime / bright youthful city area.

Possible scenery:
- trees;
- benches;
- graffiti walls;
- street lights;
- skate ramps outside the playable road;
- bushes;
- signs;
- low-rise buildings.

## Game 2 environment

### DOWNTOWN
Busier central city.

Possible scenery:
- taller buildings;
- cafés;
- shops;
- bus stops;
- street lights;
- planters;
- billboards;
- benches;
- trees.

## Game 3 environment

### NEON DISTRICT
Evening city.

Possible scenery:
- evening buildings;
- neon signs;
- illuminated billboards;
- street lights;
- decorative lights;
- skyline.

The environment must remain readable. Game 3 must not become so dark that answer text is difficult to read.

---

# 7. PSEUDO-3D / FORWARD MOTION REQUIREMENTS

This is a critical visual requirement.

Objects must be spawned in the distance and move through simulated depth.

Each world object can conceptually have a depth value (`z`).

As an object approaches:

1. it starts small near the horizon;
2. it grows;
3. it moves downward;
4. it moves outward according to its lane / horizontal world position;
5. it becomes faster visually as it gets closer;
6. it passes the player;
7. it is removed;
8. new objects continue to spawn far ahead.

This applies to:
- answer gates;
- stars;
- extra-life hearts;
- obstacles;
- road markings;
- trees;
- lamps;
- roadside props;
- other decorative scenery.

Roadside scenery must continuously renew. Do not rely on one static city background.

---

# 8. HUD DURING GAMEPLAY

Keep the centre/lower screen as clear as possible for the road.

Suggested HUD:

### Upper left
- SCORE
- star count
- BEST score

### Upper centre
Grammar question panel:

`NOW OR USUALLY? · 6/15`

Sentence/question underneath.

### Upper right
- lives
- sound
- pause

Example:

`SCORE 1250   ⭐ 18      NOW OR USUALLY? · 6/15      ❤️❤️❤️♡♡   🔊   ⏸`

Do not add an unnecessary separate progress bar. `X/15` is enough.

---

# 9. AUDIO

Music and sound effects must be controlled **separately**.

The sound control remains accessible throughout the game.

Clicking/tapping the sound icon opens a compact panel:

**MUSIC**  
volume slider

**EFFECTS**  
volume slider

Optional:
**MUTE ALL**

Volume changes must take effect immediately.

Audio settings should persist between sessions using browser local storage or equivalent local persistence.

## Suggested audio assets

Music:
- menu music;
- gameplay music (one shared track or separate track for each district).

Effects:
- collect;
- correct;
- wrong;
- collision;
- jump;
- finish;
- button click;
- quiet skateboard wheel/rolling loop.

A single pleasant collect sound may be reused for stars and extra-life pickups.

---

# 10. PAUSE

Pause button must remain visible during the run.

When paused:
- ALL gameplay movement stops;
- depth movement stops;
- answer gates stop;
- obstacles stop;
- timers stop;
- player movement stops;
- game state is frozen.

The background may be dimmed/blurred.

Pause panel:

**PAUSED**

- CONTINUE
- RESTART
- HOME

Also show:
- MUSIC volume
- EFFECTS volume

## RESTART

Restart the current mini-game from the beginning:
- Question 1/15;
- 3 lives;
- Score 0;
- Stars 0;
- Combo reset;
- base speed.

## HOME during unfinished run

If HOME is selected from pause, ask for confirmation:

**LEAVE THIS RUN?**  
Your current score will be lost.

Buttons:
- STAY
- LEAVE

---

# 11. LIVES

Start every run with:

`❤️❤️❤️♡♡`

So:
- starting lives = **3**
- maximum lives = **5**

## Extra life pickup

A collectible heart can appear during the run.

Pickup:
**+1 LIFE**

If already at 5 lives:
- do not exceed 5;
- award **+100 score** instead.

Extra lives should be relatively rare.

Suggested maximum:
- approximately 2–3 possible extra-life pickups per run.

Do not make them so common that obstacle collisions stop mattering.

---

# 12. LOSING ALL LIVES

When the last life is lost:

1. stop the current run;
2. show briefly:

**OUT OF LIVES!**  
**RESTARTING...**

3. countdown:
**3 — 2 — 1 — GO!**
4. automatically restart the SAME mini-game from Question 1.

Reset:
- lives = 3;
- score = 0;
- stars = 0;
- question = 1/15;
- combo = 0;
- speed = initial speed.

The saved BEST score must remain stored.

Do NOT show a normal Game Over menu requiring the player to manually choose retry.

---

# 13. OBSTACLES

Use approximately six reusable obstacle types.

## Can jump over OR dodge

1. Cardboard box
2. Small road bump / low obstacle
3. Trash bag

## Must dodge / change lane

4. Construction barrier
5. Large trash bin
6. Bicycle

Do not initially add moving cars or pedestrians. They add unnecessary collision/animation complexity.

Obstacle generation must never create an impossible path.

---

# 14. COLLISION

On obstacle collision:

- collision sound;
- short impact feedback;
- screen/skater shake;
- lose **1 life**;
- continue riding.

After collision, give approximately **1–1.5 seconds of invulnerability** so the player cannot lose several lives instantly from overlapping obstacles.

Score does not need to be reduced for physical collisions unless later explicitly changed.

---

# 15. STARS

Primary collectible:

### STREET STAR

Each star:
**+10 points**

Stars may appear:
- individually;
- in straight chains;
- in curves/diagonal patterns;
- around safe routes;
- between grammar questions.

They should encourage lane changes and jumps.

Stars can pulse/rotate through code rather than requiring an animated GIF.

---

# 16. STAR COMBO

Optional but agreed gameplay feature:

Collect consecutive stars without breaking the chain.

Suggested rewards:

- 5-star chain → `COMBO! +25`
- 10-star chain → `SUPER COMBO! +50`

Collision resets the combo.

Do not permanently clutter the HUD with a combo counter. Show it only when relevant.

---

# 17. ANSWER GATES

Grammar answers appear as three readable vertical gates/panels, one per lane.

They should:
- appear far in the distance;
- grow as they approach;
- spread into the three lane positions;
- be readable before reaching the player;
- use large text;
- support wrapping / responsive font sizing for longer answers.

All answer gates look neutral before selection.

Do NOT use colour to reveal the correct answer.

On correct selection:
- positive flash;
- correct sound;
- `CORRECT! +100`.

On incorrect selection:
- negative/red feedback;
- wrong sound;
- `WRONG! -50`.

Answer gate UI should preferably be generated in code rather than pre-rendered images because the text changes for every question.

---

# 18. GRAMMAR QUESTION REPEAT RULE — CRITICAL

A student must eventually choose the correct answer before advancing.

## Correct answer

- `CORRECT! +100`
- question is completed;
- advance to next question after a short gameplay interval.

## Wrong answer

- `WRONG! -50`
- do NOT reveal the correct answer;
- do NOT advance;
- after a short gameplay interval, show the SAME question again;
- shuffle answer positions across the three lanes.

## Missed all answers

If the player passes all answer gates without choosing one:

- show **MISSED! / МИМО!**
- no score penalty;
- no life penalty;
- do NOT advance;
- after a short gameplay interval, show the SAME question and same answer set again;
- shuffle lane positions.

Only a correct answer advances the question counter.

---

# 19. SAFE GRAMMAR CHOICE ZONE

Do not place an unavoidable obstacle immediately before the correct grammar gate.

When an answer-gate sequence is approaching:
- keep the immediate grammar-choice area reasonably clear;
- stars may appear if they do not interfere;
- never make the correct answer physically impossible to reach.

Grammar knowledge must determine success, not unfair obstacle placement.

---

# 20. SCORING

Agreed base scoring:

- Correct grammar answer: **+100**
- Wrong grammar answer: **-50**
- Missed grammar answer: **0**
- Star: **+10**
- Extra life while already at max lives: **+100**
- 5-star combo: **+25**
- 10-star combo: **+50**

Physical collision:
- lose 1 life;
- no required score penalty.

---

# 21. SPEED / DIFFICULTY

Suggested three stages:

Questions 1–5:
- 100% base speed

Questions 6–10:
- approximately 110%

Questions 11–15:
- approximately 120%

Show briefly:

**SPEED UP!**

However, grammar readability takes priority over arcade difficulty.

If speed increases, answer gates may need to spawn farther away so the student still has approximately **5–7 seconds** to read and decide.

Never turn grammar questions into a pure reaction-time test.

---

# 22. RHYTHM BETWEEN QUESTIONS

Do not present grammar questions continuously with no break.

Suggested rhythm:

`QUESTION → short gameplay section → QUESTION → short gameplay section`

Approximately 4–6 seconds of pure gameplay may appear between completed grammar questions.

During these intervals:
- stars;
- obstacles;
- occasional extra lives;
- scenery.

The first question should also begin only after a short initial gameplay period.

---

# 23. FINISH

After Question 15 is correctly completed:

- stop spawning grammar answer gates;
- continue a short final road section;
- show a celebratory star trail;
- player reaches a finish/skate-park destination;
- optionally perform a simple automatic trick using code movement/rotation;
- show FINISH;
- open Results.

Do not end instantly at the exact moment Question 15 is answered.

---

# 24. RESULTS SCREEN

Example:

**RIDE COMPLETE!**

**SCORE: 2840**

Important statistics:

- **FIRST TRY: X/15**
- Stars collected
- Wrong answers
- Missed answers
- Obstacles hit
- Best star combo
- Lives left
- BEST SCORE

If the player beats their record:

**NEW BEST!**

## Why FIRST TRY is important

Because the repeat rule forces every question to eventually be answered correctly, a simple `15/15 correct` is meaningless.

`FIRST TRY X/15` records how many of the 15 questions were answered correctly on the first presentation.

Buttons:

- PLAY AGAIN
- HOME

### HOME after successful completion

HOME from Results returns to **CHOOSE YOUR GAME**, not all the way to the cover screen.

The game-selection screen itself has a control to return to the main HOME cover.

---

# 25. LOCAL PERSISTENCE

Persist locally in the browser:

- Game 1 best score;
- Game 2 best score;
- Game 3 best score;
- music volume;
- effects volume.

All three games remain unlocked.

No account/login is required for this local persistence.

It is acceptable that clearing site data or using another device/browser loses these local records.

---

# 26. GAME 1 — NOW OR USUALLY?

## Grammar target

**Present Simple vs Present Continuous**

15 questions.

Include:
- affirmative sentences;
- negatives;
- questions.

The student must distinguish:
- habits/routines/general facts;
- actions happening now / around the current moment.

Use clear context and markers so only one answer is intended.

## Finalized question set

### 1
**Look! Emma ___ for the bus.**

- waits
- **is waiting**
- wait

Correct: **is waiting**

### 2
**My dad usually ___ coffee in the morning.**

- **drinks**
- is drinking
- drink

Correct: **drinks**

### 3
**Listen! Someone ___ the piano.**

- plays
- **is playing**
- play

Correct: **is playing**

### 4
**We ___ English on Mondays.**

- **study**
- are studying
- studies

Correct: **study**

### 5
**Ben ___ his room at the moment.**

- cleans
- **is cleaning**
- clean

Correct: **is cleaning**

### 6
**Sarah ___ to work by car. She always rides her bike.**

- **doesn't go**
- isn't going
- don't go

Correct: **doesn't go**

### 7
**Shh! The baby ___.**

- sleeps
- **is sleeping**
- sleep

Correct: **is sleeping**

### 8
**___ you usually ___ breakfast at home?**

- **Do / have**
- Are / having
- Does / have

Correct: **Do / have**

### 9
**Look at Tom! He ___ in the rain.**

- dances
- **is dancing**
- dance

Correct: **is dancing**

### 10
**My brother ___ breakfast. He isn't hungry in the morning.**

- **doesn't eat**
- isn't eating
- don't eat

Correct: **doesn't eat**

### 11
**Why ___ you ___?**

- do / laugh
- **are / laughing**
- is / laughing

Correct: **are / laughing**

### 12
**Kate ___ her grandparents every weekend.**

- **visits**
- is visiting
- visit

Correct: **visits**

### 13
**I ___ TV right now. I'm doing my homework.**

- don't watch
- **am not watching**
- doesn't watch

Correct: **am not watching**

### 14
**___ your train usually ___ at 8:30?**

- Do / leave
- **Does / leave**
- Is / leaving

Correct: **Does / leave**

### 15
**___ the children ___ across the street now?**

- Do / run
- **Are / running**
- Does / run

Correct: **Are / running**

---

# 27. GAME 2 — PAST OR EXPERIENCE?

## Grammar target

**Present Perfect vs Past Simple**

15 questions.

Use two alternating task styles so Game 2 is not merely a copy of Game 1.

### Type A — CHOOSE THE CORRECT FORM

Choose the correct verb form / auxiliary structure.

### Type B — CHOOSE THE TIME MARKER

The tense/form is already present and the student chooses the time marker that logically fits it.

Include:
- affirmative sentences;
- negatives;
- questions.

Never place the correct time marker already in the sentence when asking the player to choose that marker.

## Finalized question set

### TYPE A

### 1
**I ___ this film three times.**

- saw
- **have seen**
- see

Correct: **have seen**

### 2
**We ___ to Italy last summer.**

- have gone
- **went**
- go

Correct: **went**

### 3
**Mia ___ her homework yet.**

- didn't finish
- **hasn't finished**
- doesn't finish

Correct: **hasn't finished**

### 4
**___ you ever ___ a horse?**

- Did / ride
- **Have / ridden**
- Have / rode

Correct: **Have / ridden**

### 5
**Tom ___ me yesterday.**

- **called**
- has called
- calls

Correct: **called**

### 6
**I ___ that new café yet.**

- didn't try
- **haven't tried**
- don't try

Correct: **haven't tried**

### 7
**___ Sarah ___ you last night?**

- **Did / text**
- Has / texted
- Did / texted

Correct: **Did / text**

### 8
**My parents ___ Paris several times.**

- visited
- **have visited**
- have visit

Correct: **have visited**

### TYPE B — TIME MARKERS

### 9
**I've ___ finished my homework.**

- **just**
- yesterday
- last night

Correct: **just**

### 10
**We saw that film ___.**

- yet
- **last week**
- ever

Correct: **last week**

### 11
**Have you finished your project ___?**

- **yet**
- two days ago
- last Monday

Correct: **yet**

### 12
**I haven't spoken to Emma ___ Monday.**

- ago
- **since**
- yesterday

Correct: **since**

### 13
**Did you see Jack ___?**

- ever
- yet
- **yesterday**

Correct: **yesterday**

### 14
**She has ___ been abroad.**

- **never**
- last year
- ago

Correct: **never**

### 15
**He hasn't called me ___.**

- last night
- **yet**
- two days ago

Correct: **yet**

---

# 28. GAME 3 — WHAT WAS HAPPENING?

## Grammar target

**Past Simple vs Past Continuous**

15 questions.

The context must make the intended tense unambiguous.

Do not create sentences where both tenses could reasonably work without changing the intended meaning.

Use:
- specific past moments;
- background actions;
- sudden/completed events;
- `while`;
- `when`;
- `suddenly`;
- contextual follow-up where needed.

Include:
- affirmative forms;
- negatives;
- questions.

Game 3 has two task types.

### Type A — CHOOSE THE CORRECT FORM

One grammar choice.

### Type B — COMPLETE THE STORY

One sentence contains two grammar choices.

The player answers the first blank, then the sentence remains on screen with the first answer filled in, and the player answers the second blank.

The order of tenses MUST NOT always be:
Past Continuous → Past Simple.

Mix the order so the player cannot solve by memorising a pattern.

## Type A — 8 single-choice questions

### 1
**At 8 p.m. last night, I ___ for my English test.**

- studied
- **was studying**
- am studying

Correct: **was studying**

### 2
**While we were walking home, we suddenly ___ a loud crash.**

- were hearing
- **heard**
- hear

Correct: **heard**

### 3
**I ___ attention when the teacher asked me a question, so I didn't know the answer.**

- didn't pay
- **wasn't paying**
- don't pay

Correct: **wasn't paying**

### 4
**The lights suddenly ___ while we were watching TV.**

- **went out**
- were going out
- go out

Correct: **went out**

### 5
**What ___ you ___ at 10 o'clock last night?**

- Did / do
- **were / doing**
- are / doing

Correct: **were / doing**

### 6
**Jake ___ his phone while he was getting off the bus.**

- **dropped**
- was dropping
- drops

Correct: **dropped**

### 7
**At midnight, the children ___ anymore. They were all asleep.**

- didn't play
- **weren't playing**
- aren't playing

Correct: **weren't playing**

### 8
**___ it ___ when you left the house this morning?**

- Did / rain
- **Was / raining**
- Is / raining

Correct: **Was / raining**

## Type B — 7 two-step story questions

### 9 — Past Continuous → Past Simple

**While Mia ___ dinner, the fire alarm suddenly ___.**

Step 1:
- cooked
- **was cooking**
- cooks

Correct: **was cooking**

Then show:

**While Mia was cooking dinner, the fire alarm suddenly ___.**

Step 2:
- **rang**
- was ringing
- rings

Correct: **rang**

Complete sentence:

**While Mia was cooking dinner, the fire alarm suddenly rang.**

---

### 10 — Past Simple → Past Continuous

**Tom suddenly ___ his keys while he ___ for the bus.**

Step 1:
- **dropped**
- was dropping
- drops

Correct: **dropped**

Step 2:
- ran
- **was running**
- runs

Correct: **was running**

Complete sentence:

**Tom suddenly dropped his keys while he was running for the bus.**

---

### 11 — Past Continuous → Past Simple

**Emma ___ when her alarm ___ because she was already awake.**

Step 1:
- didn't sleep
- **wasn't sleeping**
- isn't sleeping

Correct: **wasn't sleeping**

Step 2:
- **rang**
- was ringing
- rings

Correct: **rang**

Complete sentence:

**Emma wasn't sleeping when her alarm rang because she was already awake.**

---

### 12 — Past Simple → Past Continuous

**The teacher ___ me a question while I ___ my notes.**

Step 1:
- **asked**
- was asking
- asks

Correct: **asked**

Step 2:
- checked
- **was checking**
- check

Correct: **was checking**

Complete sentence:

**The teacher asked me a question while I was checking my notes.**

---

### 13 — Past Continuous → Past Simple

**While the children ___ football, one of them suddenly ___ the window.**

Step 1:
- played
- **were playing**
- are playing

Correct: **were playing**

Step 2:
- **broke**
- was breaking
- breaks

Correct: **broke**

Complete sentence:

**While the children were playing football, one of them suddenly broke the window.**

---

### 14 — Past Simple → Past Continuous

**The bus suddenly ___ while we ___ about our weekend.**

Step 1:
- **stopped**
- was stopping
- stops

Correct: **stopped**

Step 2:
- talked
- **were talking**
- talk

Correct: **were talking**

Complete sentence:

**The bus suddenly stopped while we were talking about our weekend.**

---

### 15 — Past Simple → Past Continuous

**Sarah ___ an accident while she ___ home.**

Step 1:
- **saw**
- was seeing
- sees

Correct: **saw**

Step 2:
- drove
- **was driving**
- drives

Correct: **was driving**

Complete sentence:

**Sarah saw an accident while she was driving home.**

---

# 29. GAME 3 REPEAT LOGIC FOR TWO-STEP QUESTIONS

For Type B questions, each blank is a separate required grammar choice.

Example:

`The bus suddenly ___ while we ___ about our weekend.`

If Step 1 is wrong:
- WRONG -50;
- repeat Step 1;
- do not reveal correct answer.

If Step 1 is missed:
- MISSED;
- repeat Step 1.

Once Step 1 is correct:
- fill it into the sentence;
- move to Step 2.

If Step 2 is wrong/missed:
- repeat Step 2 only;
- do NOT force the player to redo the already-correct Step 1.

The full question counts as completed only after both steps are correct.

For FIRST TRY statistics, define a question as first-try correct only if **all required steps** were answered correctly on their first presentation.

---

# 30. RANDOMIZATION RULES

Answer positions must be shuffled among the three lanes.

Important:
- correct answers must not consistently appear in the same lane;
- tense type must not correspond to a fixed lane;
- after WRONG or MISSED, reshuffle the same answers;
- do not use a predictable left-middle-right sequence;
- Game 3 two-step tense order is intentionally mixed.

The player should need to read the grammar, not learn a gameplay pattern.

---

# 31. ASSET PLAN

## Skater

- transparent PNG source;
- looping ride GIF / sprite animation;
- rear/top-down view.

## Road / environment

Do not build the gameplay as one single finished background image.

Use separate world components suitable for perspective spawning.

Possible road themes:
- skate district;
- downtown;
- neon district.

## Game 1 scenery
- 2–3 trees;
- bench;
- street lamp;
- graffiti wall;
- side skate ramp;
- bush;
- sign;
- 2–3 low-rise buildings.

## Game 2 scenery
- 3–4 building façades;
- café;
- shop;
- bus stop;
- street lamp;
- tree;
- planter;
- billboard;
- bench.

Reuse suitable Game 1 assets where possible.

## Game 3 scenery
- 2–3 evening buildings;
- neon street light;
- neon signs;
- illuminated billboard;
- decorative lights;
- skyline.

Reuse suitable city geometry where possible.

## Obstacles
Transparent assets:
- cardboard box;
- road bump;
- trash bag;
- construction barrier;
- trash bin;
- bicycle.

## Collectibles
- star;
- extra-life heart.

Animation/glow can be applied in code.

## Home / selection
- HOME hero/background illustration;
- optional separate cover skater;
- three district preview images for game-selection cards.

## UI

Prefer code/CSS/SVG for:
- buttons;
- question panel;
- pause panel;
- sound panel;
- results;
- game cards;
- answer gates;
- basic icons where practical.

Do not pre-render changing text into images.

---

# 32. IMPLEMENTATION PRIORITY

Recommended build order:

1. Build a minimal pseudo-3D three-lane road.
2. Add the single looping skater animation.
3. Make lane switching feel smooth.
4. Add jump.
5. Prove that scenery spawns far away, scales and passes the player convincingly.
6. Add reusable scenery spawning/parallax.
7. Add obstacles and collision/lives.
8. Add stars and heart pickups.
9. Add answer gates.
10. Implement question/repeat/randomization logic.
11. Implement Game 1 completely.
12. Reuse the engine for Game 2.
13. Add Game 3 two-step question state.
14. Add HOME / game selection / intros.
15. Add Pause and sound controls.
16. Add Results and FIRST TRY statistics.
17. Add local persistence.
18. Add final art/audio polish.

Do NOT spend time building all final art before the pseudo-3D movement prototype proves that the forward-motion illusion works.

---

# 33. NON-NEGOTIABLE DESIGN RULES

1. Three independent mini-games, all unlocked.
2. 15 grammar questions in each game.
3. Skater runner with three lanes.
4. Player appears to genuinely move forward through a renewing pseudo-3D world.
5. Objects appear visibly in the distance before approaching.
6. One looping rear-view skater animation is sufficient.
7. Start with 3 lives; maximum 5.
8. Extra lives can be collected.
9. Wrong grammar answer = -50 and repeat same question.
10. Missed answer = MISSED and repeat same question.
11. Never reveal the correct answer after a wrong/missed choice.
12. Only a correct answer advances.
13. Losing all lives automatically restarts the current mini-game from Question 1.
14. Pause freezes the entire run.
15. Music and effects have separate persistent volume controls.
16. Sound control remains accessible throughout gameplay.
17. Best score is stored separately for each mini-game.
18. All three games remain selectable on later visits.
19. Answer lanes are shuffled.
20. Obstacles must never make the correct grammar answer impossible to reach.
21. Game 3 must not always present Past Continuous first and Past Simple second.
22. Results must include FIRST TRY X/15.
23. HOME after Results returns to the three-game selector.
24. Do not silently alter the finalized grammar sentences without explicit approval.

---

# 34. SOURCE-OF-TRUTH NOTE FOR CODEX

When implementing WORD RUSH:

- Treat this file as the master design specification.
- Preserve already-working approved mechanics unless a later explicit instruction changes them.
- If implementation details conflict with this specification, prefer this specification unless a newer explicit instruction says otherwise.
- Do not simplify away the pseudo-3D depth/spawn system into a static background.
- Do not turn the three mini-games into sequential locked levels.
- Do not auto-advance after wrong or missed grammar answers.
- Do not expose the correct answer after a mistake.
- Do not reset saved best scores/audio preferences when restarting a run.

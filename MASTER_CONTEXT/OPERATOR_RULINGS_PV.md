# OPERATOR RULINGS — PLUTUS_VISION
<!--
  The operator's own directives, verbatim, recovered from the build session transcript
  and given a citable home so no card has to cite a derived spec. Every line below is
  HIS wording. Where a line number is given it is the transcript line.
-->

## R-01 · The no-PDF architecture (2026-10-21, l.1013)
> "the current process we have is a manual three-step process. Step one, I feed the prompt to the agent... Step two, the agent generates the PDF report... Step three, the agent converts the verified reports data to Pine Scripts and puts that in the indicator."
> "the explicit fucking requirement for this build is that this PDF report as a step is removed. And this is done entirely by code in real time."
> "the prompt that generated the report itself needs to be translated into code that can run in a sidecar so that the indicator can automatically render this dynamically and does not need the manual compile the report and then copy paste the data step."

## R-02 · The sidecar contract (l.4190)
> "the output contract should probably be one JSON per week. That's cleanest. We want to keep everything batch, parallel, async where possible. As few steps in the loop as possible."
> "Assume total black hat mentality... anti-fragile, deterministic, as few fucking steps as possible, so that this just works like a fucking browser. You just click it, it just opens, it just works."
> "the sidecar agent is vision capable that's what the sidecar is for."
> "assume that you're building everything from scratch do not port anything in"

## R-03 · E2 is two phases (l.3618)
> "Phase 0 = current reality. Phase 1 = E1 zone model from original Canon E1 (face A). Phase 2 = supply/demand/liquidity added on top of IP zones (face B). Phase 3 = E2 phase one: the BOXES. Phase 4 = E2 face B: the LINE."
> "the chain leads and the shapes follow"

## R-04 · The engine decomposition (l.3607)
> "Engine one is the supply, demand, liquidity, and the institutional pressure zones. Engine 2 covers the shape chain, which is calculated from engine 1 data. Engine 3 is the actual trade setups."
> "If you do engine 1 correctly, engine 2 is obvious. If you compute engine 2 correctly, engine 3 is obvious."

## R-05 · Canon-only vocabulary (2026-10-21)
> "what is CHoCH that is not canon to my strategy. do not loop in any random terms that are 'market standard' but not part of my strategy. keep everything specific to MY actual data that is in all of these docs"

## R-06 · The graph's purpose (2026-10-21)
> "for the next 7,000 fucking sessions, I can just say go read the graph and within less than a single minute every single agent has full fucking context immediately permanently compaction proof idiot proof derailment proof"

## R-07 · The trade-count reality + the confidence gate (2026-10-22)
> "This is correct. The way that this is written is 100% correct. There are only on any given trading week a maximum of eight trades per pair that can be traded on the one hour time frame. Period. Like there are only one to two real moves per day on any given pair. Period."
> "maximum 10 per week anywhere from six to ten per week one to three per day usually one to two per day"
> "this immediately rejects all of the fabricated bullshit garbage fucking trade setups because without this agents hallucinate that there's 27 fucking trades on a single day which is absolute garbage filth trash"
> "the only thing that we change is the rrr floor on standard is increased from 1.5 to 2 and the rr on high is increased from 2 to 2.5"
> "65 the inclusion gate? Yes, 100%. I don't want anything that is less than high confidence."
> "I don't want any conditional fucking garbage... God tier and high is the new normal. Everything else is rejected. I don't even want to see it on my chart."

## R-08 · The target state (2026-10-22)
> "I want this thing to be so good that I can wake up... I just open my fucking computer with my eyes half closed. I look at the indicator, I see what the trade centers for the day are, I just blindly yeet 50 million fucking dollars into the trade, forget about it... Your job is to fucking code this in such a way where that is not only possible, but that's fucking normal."

## R-09 · The annotation grammar — position boxes vs zones (2026-10-22)
> "The red boxes is the stop loss zone. The green boxes is the entry to the take profit zone. This is literally what the trade setup tools look like when you draw them on TradingView using the actual long and short position tools. This is different from the full screen horizontal rectangles that go from the left to the right side of the screen. Those are zones. There's a big difference. You need to be able to tell the fucking difference."
> "The entry is on the intersection between the red and the green box. So from the entry down to the bottom is the stop loss threshold and from the entry up to the top is the take profit threshold... the far edge of the green box is the take profit, the far edge of the red box is the stop loss, and the intersection point between the two boxes is the entry."
> "the analysis was done on the one hour with some minor refinements on the 30 minute, the 15 minute was just for execution. But that's for me as a human... You as an AI do not need to do this because it's all computable from data so keep the one hour as the authoritative source"

## R-10 · Rockets are not trades (2026-10-22)
> "These are explicitly marking rockets for Fibonacci rockets and liquidity rockets. These are not normal trades. You need to ignore these. You need to look at the actual trade setup boxes with the actual drawing tools like I said."

## R-11 · The trade inventory already exists (2026-10-22)
> "Here is the full analysis that GLM 5.1 did with an external VLM five months ago on the exact same trades I just told you to look at. Get all of the fucking data correctly right now."

## R-12 · The build is operator-driven, turn by turn, on Pinebox (2026-11-06)
> "we're gonna build the indicator on Pine Box directly. Like you're gonna open Pine Box on my physical display. I'm gonna look at it, and we are going to base everything off of /skill:vision-in-the-loop By directly looking at the fucking rendered pixels inside of the Pine IDE and we're gonna go turn by turn. We're gonna go piece by piece. We are not going to attempt to build the whole fucking thing in one shot."
> "You're not allowed to do anything autonomously. You're not allowed to make any decisions autonomously."
> "You do not get to make decisions autonomously. I am the one driving the fucking build. You are the executor and you are gonna function as an obedient co-pilot that does exactly what I fucking say and nothing else. Period"

## R-13 · The only test is Pinebox + the chart (2026-11-06)
> "Yes, no code review, no unit test."
> "you can use bash for normal build work - all TESTING is only allowed to be doen through pinebox. any "test" that is not **literally** "run the code through pinebox and look at the chart" is explicitly forbidden"
> "A) render your code on the chart / B ) look at the chart / C) is it perfect. yes or no. look at the cnadles. do they react to your render with neo-in-the-matrix level precision. yes or no. boolean true/false. if false - score w/ clef/jev how accurate it is."
> "pinebox is your TESTING ENVIRONMENT. ANY "tests" THAT ARE NOT LITERALLY RUN IN PINEBOX FOLLOWING THE EXACT A,B,C PROCESS I LAID OUT ABOVE IN POINT #2 IS FUCKING REJECTED AND EXPLICITLY FORBIDDEN."

## R-14 · E1 is the v5.3.3 prompt, every token (2026-11-06)
> "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md this LITERALLY EXPLAINS EVERYTHING ABOUT ENGINE 1 VERBATIM IN THE MOST CLEAR EXPLICITY POSSIBLE WAY THESE ARE THE EXACT FUCKING ISNTRUCTIONS WE ARE TRANSLATING INTO CODE FOR E1. NOTHING IS ALLOWED TO BE CHANGED OR EDITED OR WATERED DOWN OR ELFT OFF. EVERY SINGLE FUCKING TOKEN OF E1 IN THIS PROMPT - FOLLOW THESE EXACT INSTRUCTIONS. CONVERT THIS TO CODE."

## R-15 · Acceptance: the golden week, then 15 random weeks, uniform 95%+ (2026-11-06)
> "First we're gonna completely nail engine one and get it fully mastered, tested, validated, 95% plus accurate. across 15 different random weeks, five on three different assets."
> "measured against the actual fucking price action on the chart. literally render your shit on the pine IDE and look at the chart. is the actual price action 95% accurate to your predictions and render like the Jul 6-10 golden week examples?"
> "ANY random 15 fucking weeks from the moment Trump's 2nd term as US president began it does not fucking matter AT ALL. first we validate the golden week of Jul 6-10 since we a visual oracle to judge against already. once that SUCCEEDS at 95%+ accuracy then any random 15 weeks. if we do not have the SAME 95%+ ACCURACY UNIFORM ACROSS 15 RANDOM FUCKING WEEKS - YOU CODED IT WRONG. NO HARDCODED FIXED CONST BULLSHIT."
> "THE ENGINES AND CALCULATIONS NEED TO BE STRUCTURED ON THE MACRO PRINCIPLES SO THAT ONCE WE HIT THE TARGET ON THE GOLDEN WEEK IT WILL WORK UNIVERSALLY EBCAUSE EVERY SINGLE WEEK AND ASSET FOLLOWS THE EXACT SAME PRINCIPLES. YOU ARE NTO AHRDCODING SOME VISUAL SLOP BULLSHIT. YOU ARE BUILDING A PREDICTION ENGINE THAT CAN ACCURATELY FOLLOW THE E1/E2/E3 STRUCTURE. I HAVE PERSONALLY TESTED THIS THE STRATEGY WORKS UNIVERSALLY ON EVEYR ASSET, EVERY TIMEFRAME. THERE IS NO FLAW IN THE STRATEGY. IT WORKS EXACTLY THE WAY I SAID. THE ISSUE IS **ALWAYS** YOUR SHITTY CODE."

## R-16 · E3 authority = the corrected E3 prompt; v8 archived (2026-11-06)
> "the AUTHORITY is /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md which does not yet exist as code and is not to even eb touched until E1/E2 are WORKING. fix this in the graph. june era shit slop python code is archived and for historical reference only"
(Graph: cards/E3-AUTHORITY-RULING.md. Iron Law 2 is SUPERSEDED.)

## R-17 · ZFP is strength only; width ZFP is deleted (2026-11-06)
> "ANYTHIN THAT CALCULATES ZFP BASED ON FUCKING PIXEL WIDTH NEEDS TO BE PERMANENTLY FUCKING DELETED THIS IS THEATRICAL BULLSHIT. ZFP = ZONE FAILURE PROBABILITY WHAT DO YOU THINK THAT MEANS OBVIOUSLY ON STRENGTH AND NOTHING ELSE."
(Restates the 2026-10-22 ruling in cards/E1-ZFP-DUAL-DEFINITION-RULING.md.)

## R-18 · The deliverable and the phase order (2026-11-06)
> "a working fuckign indicator with a functioning E1 that renders the actual S/D/L + IP zones for any trading week it is pointed at with 95%+ accuracy. then we build on top of that foundation to incorporate E2 at the same quality + precision level follow the same process that successfully calibrated E1. then the same with E3 once E2 passes the tests."
> "Once engine one is working then we're going to Move to engine two. We're gonna repeat the exact same building and testing process on engine two that we had validated on engine one that got engine one production grade. Same exact process."

## R-19 · The harvest is all of Part III; the sidecar runs on pi-durable inside Cloudflare (2026-11-06)
> "half the data comes from the web sources lsited in the 5.3.3 promtp thats the entire fucking reason we are building a sidecar agent on pi durable."
> "so then all this needs to be added in obviously last agent watered it down against explicit instructions"
> "the sidecar agent is harnessed on pi durable according to the concept and frameworks of /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/agent_plugin_boilerplates/aether_agent_backend_v2 and runs IN CLOUDFLARE as a cloudflare durable object + worker runtime so that it is always on 24/7 and doesnt need my physical device active to function. we need to get clear on this. browser run is just the cloudflare broser runtime"

## R-20 · The tools are done; the Plutus build is unlocked (2026-11-06)
> "This was locked until the tools were done. The tools are now done."
> "750 megabytes is accepted."
> "The Pine Box build is already completed and it's deployed on host and you can use the tool right now."

## R-21 · Mechanical workflows, never an agent loop (2026-11-06)
> "yes option A ~ fuck an agent loop. we need MECHANICAL WORKFLOWS with specific model-enabled STEPS in the workflow lets start designing this like a zapier tree not a fucking agent loop. fuck agent loops."
(Option A = pi-durable runs code tasks inside the Durable Object; models appear only as named steps — Clairic reads, Clef judges. No model chooses a step, a page, or a tool.)

## R-22 · Cloudflare replaces the physical device (2026-11-06)
> "yes 100% cloudlfare is officialy replacing my physical device i should eb able to run this from a fuckign arduino if i so choose. EVERYTHING runs on cloudlfare now unless it physically cannot for a tangible reason and then we use the local device only for that specific step."

## R-23 · Bars come from TradingView via tvdatafeed, not yfinance (2026-11-06)
> "where the fuck is yfinance coming from? what is this? explain. should be tvdatafeed."
(Matches PLUTUS_ARCHITECTURE_BIBLE_v2.1.md:1173-1175 "NEVER use Yahoo Finance. TradingView tvDatafeed ONLY." and Iron Law 9, :1384. Overrides the yfinance + Yahoo rows of the v5.3.3 prompt, :755-756 and :766.)

## R-24 · investinglive needs a headed browser (2026-11-06)
> "investing live obviously needs headed."
(Agrees with the v5.3.3 prompt :813: "investinglive.com blocks headless browsers with 403/CloudFront.")

## R-25 · The cf/ draft is archived; v5 is the authoritative design (2026-11-06)
> "sure archive it we are building authoritative v5 right now"
(cf/ moved to archive/cf-draft-2026-11-01/, reference only.)

## R-26 · The headed browser runs locally, on the Plutus dashboard's browser tab (2026-11-06)
> "ok run it locally then we can have the headed browser run localy. we already have a browser tab on plutus dashbaord built for exactly this."
> "either way we can use the plutus dashbaord browser tab on local device for all headed browser needs. i will have the pinebox agent add this as a 3rd tab to pinebox as well so its in the testing env"
> "i will be using the plutus-dashbaord as THE runtime env for all trading once this is production grade anyways"
(Container cost rule: a container only if < 5% of the month's included usage for daily use; measured memory share for a headed standard-1 run is 16% at 2 min/day, so local.)

## R-27 · plutus-browser is its own host tool, separate from Pinebox (2026-11-07)
> "can you package plutus browser as a standalone self contained tool like we have pinebox as a proper tool? then update the ship package for this and deploy it to host. we can keep these as 2 separate tools its easier that way."
(Done: CLI + actions.json + OMP extension + deploy.sh; commit 0fc9fd2, tag ship/plutus-browser-v2026.11.07-1; package SHIP_PACKAGES/plutus-browser.)

## R-28 · Tunnel routing: the simplest Cloudflare default, no steps for the operator (2026-11-07)
> "use whatever is simplest do the cloudflare default dont add any steps for me"

## R-29 · The v5 design is written for the operator to review (2026-11-07)
> "write it so i can review"

## R-30 · The entire E1 renders on the chart, layered ON TOP of the v1 working baseline (2026-11-07)
> "what the fuck do you mean we need to see THE ENTIRE FUCKIN E1 RENDERED ON THE CHART ~ you need to also integrate this ON TOP OF the foundation laid with /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Checkpoints/v1-ship-approved-working-baseline ~ this is a combination of LuxAlgo's liquidity + S/D indicators. the Liqudity zones are A+ and the S/D are A- need some minor improvement to catch ALL the relevant zones but this already solves 1 side of the coin so you just need to add the E1 canon from the prompt (2nd side of the coin) to be rendered ON TOP OF this. that way it can auto detect any trading week and render the ACCURATE zones for that specific tradying week. FULL E1 data no partial bullshit"
(The v1 seal plutus-vision-v1.pine, sha 0d20e831..., stays unedited (H1): E1 is added as a layer in a new file.)

## R-31 · Operator pace and scope on small jobs (2026-11-07)
> "what is taking so long" / "this should be a simple 2 minute taks"
(A packaging job is not a bug hunt on the runtime. Do what was ordered; do not add unrequested fixes.)

## R-32 · What subagents are for (2026-11-07)
> "subagents are for BUILDING and DEEP CONTEXT EXTRACTION OF THOUSANDS OF LINES OF RANDOM SCATTERED CONTEXT FROM THE FILEBASE. NOT 300 LINES OF DIRECT FIRST HAND CONTEXT YOU ARE FUCKING RESPONSIBLE FOR"
> "handle this yourself"
(A known file or range I am responsible for - the 5.3.3 prompt, a named checkpoint - is read first-hand by me. Subagents build, or hunt scattered context across the file base. Seven E1 extraction readers were killed on this ruling; their files in design/e1-extract/ are unused and not evidence.)

## R-33 · Pinebox Cloud is verified and its old open checklist is not a gate (2026-11-08)
> "everything works i ve verified it myself"
> "there are no remaining bugs"
> "treat open verification tasks as cosmetic or agentic perfectionism"
(Use the updated central SHIP_PACKAGES/pinebox Cloud substrate directly. Do not reopen its historical F-items or rerun its verification checklist before building PLUTUS VISION.)

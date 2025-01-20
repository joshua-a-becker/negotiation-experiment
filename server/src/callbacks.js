import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { calculatePoints, updatePlayerPoints, getFeatureData } from './helper'
export const Empirica = new ClassicListenersCollector();

// Game Start Listener
Empirica.onGameStart(({ game }) => {
  console.log("🚀 ~ Empirica.onGameStart ~ game:", game)

  const treatment = game.get("treatment");
  game.set("agreementHistory", [])

  const { numRounds, informalSubmitDuration, formalSubmitDuration, formalVoteDuration } = treatment;

  for (let i = 1; i <= numRounds; i++) {
    const round = game.addRound({
      name: `Round ${i}`,
    });

    round.addStage({ name: "Discussion and Informal Vote", duration: informalSubmitDuration });
    round.addStage({ name: "Formal Proposal", duration: formalSubmitDuration });
    round.addStage({ name: "Formal Vote", duration: formalVoteDuration });
    round.addStage({ name: "Round Summary", duration: 45 });
  }

  // Shuffle and assign roles to players
  const numOfPlayers = game.players.length;
  const shuffledRoles = Array.from({ length: numOfPlayers }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5)
    .map(n => `role${n}`)

  console.log("🚀 ~ Empirica.onGameStart ~ shuffledRoles:", shuffledRoles)

  game.players.forEach((player, index) => {

    const roleIndex = index % shuffledRoles.length;
    const role = shuffledRoles[roleIndex];

    player.set("role", role);
    player.set("bonus", [])
  });

  game.set("submitCount", 0);
  game.set("submissions", []);
  game.set("roundResults", []);
});


// Round Start Listener
Empirica.onRoundStart(async ({ round }) => {
  console.log("Round has started!");
  round.append("chat", {
    text: `round started`,
    sender: {
      Time: Date.now(),
      role: "Notification",
      name: "Notification",
    },
  });

  const { featureUrl } = round.currentGame.get("treatment");
  const featureData = round.currentGame.get("featureData")

  if (featureData === "undefined") {
    console.log(`Fetching data from ${featureUrl}`)

    try {
      const response = getFeatureData(featureUrl)

      round.currentGame.set("featureData", response)
    } catch (error) {
      console.error("Failed to load features:", error)
    }
  }

  const startTime = Date.now();

  round.set("roundStartTime", startTime);
  round.set("proposalHistory", [])
  round.set("systemMessages", []);

  console.log(`Round ${round.get("index")} Start: Round start time set at ${startTime}`);
});



Empirica.on("round", "proposalHistory", (ctx, { round, proposalHistory }) => {
  const { playerCount } = round.currentGame.get("treatment")

  if (!playerCount) {
    console.warn("Player count not found in treatment data.");
    return;
  }

  // Get the latest proposal
  const proposalKeys = Object.keys(proposalHistory);
  const latestProposal = proposalHistory[proposalKeys[proposalKeys.length - 1]];

  if (!latestProposal) {
    console.log("No proposal yet.");
    return;
  }

  if (!latestProposal.formalVote || latestProposal.formalVote.length === 0) {
    console.log("No formal vote on the latest proposal.");
    return;
  }

  // Calculate the total votes in the formal vote
  const formalVoteCount = latestProposal.formalVote
    .flatMap(Object.values)
    .reduce((sum, val) => sum + Number(val), 0);


  if (formalVoteCount === playerCount) {
    console.log("Formal vote passed.");
    round.set("formalPassed", true);

    round.currentGame.players.forEach(player => {
      player.stage.set("submit", true);
    });

    console.log("Players submitted successfully!");
  }
});


// Stage Start Listener
Empirica.onStageStart(({ stage }) => {

  const game = stage.currentGame;

  const round = game.currentRound

  const { scenario, playerCount } = game.get("treatment");
  console.log("🚀 ~ Empirica.onStageStart ~ playerCount:", playerCount)
  console.log("🚀 ~ Empirica.onStageStart ~ scenario:", scenario)


  const featureData = game.get("featureData")?.[scenario];
  console.log("🚀 ~ Empirica.onStageStart ~ featureData:", featureData)

  const role1 = featureData?.roleNames?.role1 || ""
  console.log("🚀 ~ Empirica.onStageStart ~ role1:", role1)

  const stageName = stage.get("name")
  console.log("🚀 ~ Empirica.onStageStart ~ stageName:", stageName)

  const players = round.currentGame.players;
  console.log("🚀 ~ Empirica.onStageStart ~ players:", players)

  if (round.get("formalPassed") && stageName != "Round Summary") {
    players.forEach(player => { player.stage.set("submit", true) });
  }

  if (stageName == "Formal Proposal") {
    round.append("chat", {
      text: `Time has run out! ${role1} will now make a final proposal.`,
      sender: {
        Time: Date.now(),
        role: "Notification",
        name: "Notification",
      },
    });
  }

  if (stageName == "Round Summary") {
    const proposalHistory = round.get("proposalHistory")
    console.log("🚀 ~ Empirica.onStageStart ~ proposalHistory:", proposalHistory)
    const latestProposal = proposalHistory[Object.keys(proposalHistory)[Object.keys(proposalHistory).length - 1]]
    console.log("🚀 ~ Empirica.onStageStart ~ latestProposal:", latestProposal)

    players.forEach(player => {
      let playerBonus = calculatePoints(featureData.features, latestProposal?.decisions, player.get("role"))
      console.log("🚀 ~ Empirica.onStageStart ~ playerBonus:", playerBonus)

      let roundSummary = ""

      if (latestProposal.formalVote.length < playerCount) {
        roundSummary = "Sorry, no vote was completed in time.  You earned no bonus."
        playerBonus = 0
      }

      const formalVoteCount = latestProposal.formalVote
        .flatMap(obj => Object.values(obj))
        .reduce((sum, val) => sum + Number(val), 0);

      console.log("🚀 ~ Empirica.onStageStart ~ formalVoteCount:", formalVoteCount)


      if (formalVoteCount < playerCount) {

        roundSummary = "Sorry, no vote was completed in time. You earned no bonus."
        playerBonus = 0

      } else if (formalVoteCount == playerCount) {

        roundSummary = `Congratulations! You have reached agreement! You earned an additional bonus: ${playerBonus.toFixed(2)}`;
      }

      player.round.set("roundSummary", roundSummary)
      player.set("bonus", [
        ...player.get("bonus"),
        { round: featureData?.product_name, bonus: playerBonus.toFixed(2) }
      ]);
    });
  }
});


// Stage End Listener
Empirica.onStageEnded(({ stage }) => {
  const stageName = stage.get("name");
  const round = stage.round;
  const roundIndex = round.get("index");
  const players = stage.currentGame.players;
  const playerBonusesByRole = round.get("playerBonusesByRole") || {};

  if (!players || players.length === 0) {
    console.log("No players to process in this stage.");
    return;
  }

  const roundPointsHistory = stage.currentGame.get("RoundPointsHistory") || [];
  const pass = round.get("pass") || false;

  // Handle "Discussion and Informal Vote" stage
  if (stageName === "Discussion and Informal Vote") {

    // Check for early game termination

    for (const player of players) {

      if (player.get("goendTriggered")) {
        console.log("Game ended early due to trigger in Discussion and Informal Vote stage.");

        player.set("endearly", true);
        stage.currentGame.end("failed", "end early due to goendTriggered");

        return;
      }
    }

    // Reset bonuses if round failed
    if (!pass && Object.keys(playerBonusesByRole).length > 0) {
      for (const role in playerBonusesByRole) {
        playerBonusesByRole[role] = 0;
      }
    }

    // Update points and round history
    const updatedHistory = updatePlayerPoints(
      players,
      playerBonusesByRole,
      roundIndex,
      roundPointsHistory
    );

    stage.currentGame.set("RoundPointsHistory", [...roundPointsHistory, ...updatedHistory]);

    console.log("Round Points History:");
    updatedHistory.forEach(({ roundIndex, roleName, role, totalPoints }) => {
      console.log(
        `Round ${roundIndex + 1}: Role Name: ${roleName}, Role: ${role}, Total Points: ${totalPoints}`
      );
    });
  }

  // Handle "Formal Vote" stage
  if (stageName === "Formal Vote") {

    // Reset bonuses if round failed
    if (!pass && Object.keys(playerBonusesByRole).length > 0) {
      for (const role in playerBonusesByRole) {
        playerBonusesByRole[role] = 0;
      }
    }

    // Update points and round history
    const updatedHistory = updatePlayerPoints(
      players,
      playerBonusesByRole,
      roundIndex,
      roundPointsHistory
    );

    stage.currentGame.set("RoundPointsHistory", [...roundPointsHistory, ...updatedHistory]);

    console.log("Round Points History:");
    updatedHistory.forEach(({ roundIndex, roleName, role, totalPoints }) => {
      console.log(
        `Round ${roundIndex + 1}: Role Name: ${roleName}, Role: ${role}, Total Points: ${totalPoints}`
      );
    });
  }

});

Empirica.onRoundEnded(({ round }) => {
  round.currentGame.set("test", 1)
  round.currentGame.set("missingProposal", round.get("missingProposal"))
  round.currentGame.set("pass", round.get("pass"))
});

Empirica.onGameEnded(({ game }) => { });


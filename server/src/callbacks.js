import { ClassicListenersCollector } from "@empirica/core/admin/classic";


export const Empirica = new ClassicListenersCollector();
//import { usePlayer, useGame } from "@empirica/core/player/classic/react";

Empirica.onGameStart(({ game }) => {
  const treatment = game.get("treatment");
  game.set("agreementHistory", [])
  const { role1, role2, role3, numRounds, informalSubmitDuration, formalSubmitDuration, formalVoteDuration, resultDuration, featureUrl } = treatment;

  for (let i = 0; i < numRounds; i++) {
    const round = game.addRound({
      name: `Round ${i + 1}`,
    });
    round.addStage({ name: "Discussion and Informal Vote", duration: informalSubmitDuration });
    round.addStage({ name: "Submit Formal Vote", duration: formalSubmitDuration });
    round.addStage({ name: "Formal Vote", duration: formalVoteDuration });
    round.addStage({ name: "Round Summary", duration: 120 });
  }



  const roles = [{ key: "role1", name: role1 }, { key: "role2", name: role2 }, { key: "role3", name: role3 }];


  const shuffledRoles = roles.sort(() => Math.random() - 0.5);

  game.players.forEach((player, index) => {
    const roleIndex = index % shuffledRoles.length;
    const role = shuffledRoles[roleIndex];
    player.set("role", role.key); 
    player.set("name", role.name);
  });
  game.set("submitCount", 0);
  game.set("submissions", []);
  game.set("roundResults", []);
});


Empirica.onRoundStart(({ round }) => {


  const featureUrl = round.currentGame.get("treatment").featureUrl;
  
  if (round.currentGame.get("featureData") === "undefined") {
    console.log("round start fetch")
    fetch(featureUrl)
      .then(response => response.json()) // 将响应转换为 JSON
      .then(data => {
        round.currentGame.set("featureData", data)
        console.log("done inside roundstart")
      })
      .catch(error => console.error("Failed to load features:", error)); // 处理可能的错误
  }

  //round.set("proposalVoteHistory", [])
  round.set("proposalHistory", [])
  round.set("systemMessages", []);
  const startTime = Date.now();
  round.set("roundStartTime", startTime);
  console.log(`Round ${round.get("index")} Start: Round start time set at ${new Date(startTime).toISOString()}`);
});


Empirica.on("round", "proposalHistory", (ctx, { round, proposalHistory }) => {

  // IF FORMAL VOTE STAGE, WE WILL HAVE FORMAL VOTES WITH NO INFORMAL VOTES
  

  // NOTE:  WE ONLY CARE IF THERE'S A FORMAL VOTE PASSED
  const playerCount = round.currentGame.get("treatment").playerCount;

  const latestProposal = proposalHistory[Object.keys(proposalHistory)[Object.keys(proposalHistory).length - 1]]

  //NO PROPOSAL YET
  if(!latestProposal) { console.log("no proposal yet"); return; }

  //A PROPOSAL BUT
  //THERE WAS NO FORMAL VOTE
  if(latestProposal.formalVote.length == 0) { console.log("no formal vote"); return; }

  //A FORMAL VOTE.
  //DID IT PASS?
  const formalVoteCount = latestProposal.formalVote
    .flatMap(obj => Object.values(obj))
    .reduce((sum, val) => sum + Number(val), 0);

  if(formalVoteCount==playerCount) {
    players = round.currentGame.players;
    round.set("formalPassed",true)
    console.log("playersubmit")
    players.forEach(player => { player.stage.set("submit", true) });
    console.log("success!")
  }
  
});

Empirica.onStageStart(({ stage }) => {

  round = stage.currentGame.currentRound

  if(stage.get("name") == "Round Summary") {
    // log round results into game results for exit page
  }

  console.log("Start " + stage.get("name"))

  if(round.get("formalPassed") & stage.get("name") != "Round Summary") {
    players = round.currentGame.players;  
    console.log("playersubmit")
    players.forEach(player => { player.stage.set("submit", true) });  
  } 

});

Empirica.onStageEnded(({ stage, game }) => {
  console.log("End of stage: " + stage.get("name"))

  if (stage.get("name") === "Discussion and Informal Vote") {
    console.log("End of Discussion and Informal Vote stage");
    const players = stage.currentGame.players;
    for (const player of players) {
      const goendTriggeredyes = player.get("goendTriggered");
      if (goendTriggeredyes) {
        console.log(`Game ended early due to trigger in Discussion and Informal Vote stage.`);
        player.set("endearly", true);

        stage.currentGame.end("failed", "end early due to goendTriggered");
        break;
      }
    }
  }

  if (stage.get("name") === "Discussion and Informal Vote") {
    console.log("End of Discussion and Informal Vote stage");

    const round = stage.round;
    const roundIndex = round.get("index");
    const pass = round.get("pass");
    const players = stage.currentGame.players;

    const playerBonusesByRole = round.get("playerBonusesByRole") || {};

    if (!pass) {
      for (const role in playerBonusesByRole) {
        playerBonusesByRole[role] = 0;
      }
    }

    let roundPointsHistory = stage.currentGame.get("RoundPointsHistory") || [];

    for (const player of players) {
      const role = player.get("role");
      const roleName = player.get("name");

      let totalPoints = playerBonusesByRole[role] || 0;

      const cumulativePoints = player.get("cumulativePoints") || 0;
      const updatedCumulativePoints = totalPoints + cumulativePoints;

      player.set("roundPoints", totalPoints);
      player.set("cumulativePoints", updatedCumulativePoints);
      player.set("RoundPointsHistory", roundPointsHistory);

      roundPointsHistory.push({ roundIndex, totalPoints, roleName, role });
    }

    stage.currentGame.set("RoundPointsHistory", roundPointsHistory);

    //console.log("141 Round Points History:");

    roundPointsHistory.forEach((roundData) => {
      //console.log(`Round ${roundData.roundIndex + 1}: Rolename: ${roundData.roleName}, Role: ${roundData.role}, Total points: ${roundData.totalPoints}`);
    });
  }

  // only needed for the formal vote
  if (stage.get("name") !== "Formal Vote") return;

  const players = stage.currentGame.players;
  const round = stage.round;
  const roundIndex = round.get("index");
  const pass = round.get("pass");

  const playerBonusesByRole = round.get("playerBonusesByRole") || {};

  if (!pass) {
    for (const role in playerBonusesByRole) {
      playerBonusesByRole[role] = 0;
    }
  }

  let roundPointsHistory = stage.currentGame.get("RoundPointsHistory") || [];

  for (const player of players) {
    const role = player.get("role");
    const roleName = player.get("name");

    let totalPoints = playerBonusesByRole[role] || 0;

    const cumulativePoints = player.get("cumulativePoints") || 0;
    const updatedCumulativePoints = totalPoints + cumulativePoints;

    player.set("roundPoints", totalPoints);
    player.set("cumulativePoints", updatedCumulativePoints);
    player.set("RoundPointsHistory", roundPointsHistory);

    roundPointsHistory.push({ roundIndex, totalPoints, roleName, role });
  }

  stage.currentGame.set("RoundPointsHistory", roundPointsHistory);
  console.log("183 Round Points History:");
  roundPointsHistory.forEach((roundData) => {
    console.log("185")
    console.log(`Round ${roundData.roundIndex + 1}: Rolename: ${roundData.roleName}, Role: ${roundData.role}, Total points: ${roundData.totalPoints}`);
  });

});



Empirica.onRoundEnded(({ round }) => {
  console.log("Round Ended")

  round.currentGame.set("test", 1)
  round.currentGame.set("missingProposal", round.get("missingProposal"))
  round.currentGame.set("pass", round.get("pass"))
});
Empirica.onGameEnded(({ game }) => { });



Empirica.on("round", "watchValue", (ctx, { round, watchValue }) => {

  console.log("proposal")
  console.log(round.get("proposalHistory"))

  console.log("proposal with vote")
  console.log(round.get("proposalVoteHistory"))

  //round.set("proposalHistory",[])
  //round.set("proposalVoteHistory",[])

});


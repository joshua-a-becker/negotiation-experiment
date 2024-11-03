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
    round.addStage({ name: "Round Summary", duration: 12000 });
  }

  const roles = [{ key: "role1", name: role1 }, { key: "role2", name: role2 }, { key: "role3", name: role3 }];


  const shuffledRoles = roles.sort(() => Math.random() - 0.5);

  game.players.forEach((player, index) => {
    const roleIndex = index % shuffledRoles.length;
    const role = shuffledRoles[roleIndex];
    player.set("role", role.key); 
    player.set("name", role.name);
    player.set("bonus", [])
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

  const round = stage.currentGame.currentRound
  const players = round.currentGame.players;  
  console.log("Start " + stage.get("name"))

  if(round.get("formalPassed") & stage.get("name") != "Round Summary") {
    console.log("playersubmit")
    players.forEach(player => { player.stage.set("submit", true) });  
  } 

  
  if(stage.get("name") == "Round Summary") {
    // log round results into game results for exit page
    
    const game = round.currentGame
    const treatment = game.get("treatment");  
    const treatmentFeatureData = game.get("featureData")[treatment.scenario]
    const playerCount = treatment.playerCount;
    const ph = round.get("proposalHistory") 
    const latestProposal = ph[Object.keys(ph)[Object.keys(ph).length - 1]]
  
    const calculatePoints = (selectedFeatures, playerRole) => {
      const featuresToCalc = treatmentFeatureData.features
  
  
      const pointsReturn = featuresToCalc.reduce((total, feature) => {
          const isSelected = selectedFeatures[feature.name];
          const roleBonus = feature.bonus[playerRole] || 0;
          return (total + (isSelected ? roleBonus : 0));
      }, 0);
  
      return ( Number(pointsReturn.toFixed(1)) );
    }

    players.forEach(player => { 

      let playerBonus = calculatePoints(latestProposal.decisions, player.get("role") )

      let roundSummary = ""

      if(latestProposal.formalVote.length < playerCount) {
        roundSummary = "Sorry, no vote was completed in time.  You earned no bonus."
        playerBonus=0
      }

      const formalVoteCount = latestProposal.formalVote
        .flatMap(obj => Object.values(obj))
        .reduce((sum, val) => sum + Number(val), 0);


      if(formalVoteCount<playerCount) {
        roundSummary = "Sorry, the vote did not pass, no agreement was reached.  You earned no bonus."
        playerBonus=0
      } else if(formalVoteCount==playerCount) {
        roundSummary = 
          "Congratulations!  You have reached agreement!<br/><br/>"+
          "You received an additional bonus from this round: " + playerBonus                      
      }
      
      player.round.set("roundSummary", roundSummary)
      playerBonusList = player.get("bonus")
      playerBonusList.push({"round": treatmentFeatureData.product_name, "bonus":playerBonus})
      player.set("bonus", playerBonusList)
    });  
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


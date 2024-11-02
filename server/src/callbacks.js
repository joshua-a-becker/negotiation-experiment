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
    round.addStage({ name: "Round Summary", duration: 10000 });
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

Empirica.onStageStart(({ stage }) => {


  console.log("stage START")
  round = stage.round;
  roundOver = round.get("roundOver")
  console.log("Round over: " + roundOver)
  if(roundOver & stage.get("name") != "Round Summary") {
    console.log("Proposal passed.  Ending round.") 
    const players = stage.currentGame.players;
    players.forEach(player => {

      player.stage.set("submit", true);

    });
  }


  if (stage.get("name") === "Informal Submit") {

    const players = stage.currentGame.players;
    for (const player of players) {

      console.log(`Reset vote for player ${player.id}`);
    }
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


Empirica.on("round", "proposalOutcome", (ctx, { round, proposalOutcome }) => {
  if(proposalOutcome=="passed") {
    const game = round.currentGame;
    const players = game.players;

    round.set("roundOver", true)
    console.log("Proposal passed.  Ending round.") 
    console.log("game over: " + game.get("gameOver"))
    players.forEach(player => {

      player.stage.set("submit", true);

    });
  }

  // console.log("Round/PO callback")
  if(proposalOutcome===null) return;
  // console.log("P OUTCOME: " + proposalOutcome)

  const proposalItems = round.get("lastProposalItems")
  const submitterRole = round.get("lastProposalSubmitter")
  round.set("votesFormal", {});
  const votes = round.get("votesFormal") || {};
  const votes_for = Object.values(votes).filter(vote => vote === true).length;
  // const noCount =   Object.values(votes).filter(vote => vote === false).length;


  const passtext = proposalOutcome === 'passed' ? "OFFICIAL proposal by " + submitterRole + " passed.  "
    : "OFFICIAL proposal by " + submitterRole + " rejected with " + votes_for + " yes votes.  "

  const text = passtext + "Proposal included: " + proposalItems

  console.log(text)

  round.append("chat", {
    text,
    sender: {
      id: Date.now(),
      name: "Notification",
      role: "Notification",
    },
  });


});

Empirica.on("round", "proposalStatus", (ctx, { round, proposalStatus }) => {

  playerCount = round.currentGame.get("treatment").playerCount

  if (proposalStatus.status && proposalStatus.content.proposal.vote) {
    countVotes = proposalStatus.content.proposal.vote.length
    if (countVotes >= playerCount) {


      const resultingProposal = proposalStatus.content.proposal


      const votes_for = resultingProposal.vote.filter(v => Object.values(v) == 1).length
      const votes_against = resultingProposal.vote.filter(v => Object.values(v) == 0).length

      resultingProposal.result = { for: votes_for, against: votes_against }

      const proposalItems = Object.keys(proposalStatus.content.proposal.decisions).join(", ")
      const submitterRole = resultingProposal.submitterRole

      console.log('  ${submission_data.submitterRole}')
      // reset vote status 
      round.set("proposalStatus", {
        status: false,
        content: {
          message: "this is a message",
          proposal: resultingProposal
        }
      })


      const ph = round.get("proposalVoteHistory")
      ph.push(resultingProposal)
      round.set("proposalVoteHistory", ph)


      const passtext = votes_for >= playerCount ? "INFORMAL proposal by " + submitterRole + " passed.  "
        : "INFORMAL proposal by " + submitterRole + " rejected with " + votes_for + " yes votes.  "

      const text = passtext + "Proposal included: " + proposalItems
      round.append("chat", {
        text,
        sender: {
          id: Date.now(),
          name: "Notification",
          role: "Notification",
        },
      });


      round.set("lastProposalItems", proposalItems)
      round.set("lastProposalSubmitter", submitterRole)
      round.set("lastProposalVoteCount", votes_for)

    }
  } else {
    console.log("resetting vote")
  }
});


Empirica.on("round", "watchValue", (ctx, { round, watchValue }) => {

  console.log("proposal")
  console.log(round.get("proposalHistory"))

  console.log("proposal with vote")
  console.log(round.get("proposalVoteHistory"))

  //round.set("proposalHistory",[])
  //round.set("proposalVoteHistory",[])

});


Empirica.on("round", "goendTriggered", (ctx, { round, goendTriggered }) => {


  if (goendTriggered === true) {
    console.log("Go end triggered, preparing to move.");

    const players = round.currentGame.players;

    const stages = round.stages;


    const resultStage = stages.find(stage => stage.name === "Result");

    if (resultStage) {
      players.forEach(player => {

        player.stage.set(resultStage);

      });
    } else {
      console.log("Result stage not found. Please check the stage setup.");
    }

  } else {
    console.log("Go end not triggered.");
  }
});



// // //formalvote.jsx
import React, { useEffect, useState } from "react";
import { usePlayer, usePlayers, useRound, useGame } from "@empirica/core/player/classic/react";
import './css/TableStyles.css';
import { useChat } from '../ChatContext';
import { Button } from "../components/Button";
import CustomModal from "./Modal";



export function FormalVote() {


  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const { appendSystemMessage } = useChat();
  const game = useGame();
  const [submittedData, setSubmittedData] = useState(null);
  const isVoting = round.get("isVoting");
  const submittedData_formal = round.get("submittedData_formal");
  const pass = players.filter(p => p.get("role") !== "role1").every(p => p.get("vote") === "For");
  const totalPoints = round.get("totalPoints");
  const selectedFeatureNames = submittedData_formal ? Object.keys(submittedData_formal.decisions).join(", ") : "No features selected";
  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const allPlayersVoted = players.every(p => p.get("vote") || p.get("role") === "role1");
  const forVotes = players.filter(p => p.get("vote") === "For").length;
  const againstVotes = players.filter(p => p.get("vote") === "Against").length;
  const formalresultText = `Formal Voting Results: ${forVotes + 1} Accept, ${againstVotes} Reject. ` + (pass ? "The proposal has been accepted." : "The proposal has not been accepted.");
  const treatment = game.get("treatment");

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCloseModal = () => {
    setShowModal(false);
  };


  const featureData = game.get("featureData")[treatment.scenario]

  const features = featureData === undefined ? undefined : featureData.features


  const desiredFeaturesForRole = features === undefined ? undefined :
    features.filter(feature => feature.bonus[player.get("role")] === 1)
      .map(feature => feature.name)
      .join(", ");

  const currentPlayerRole = player.get("role");

  const role1 = featureData === undefined ? "" :
    featureData.roleNames === undefined ? "" :
      featureData.roleNames['role1']

  useEffect(() => {
    const dataFormal = round.get("submittedData_formal");
    if (dataFormal) {
      setSubmittedData(dataFormal);
    }
  }, [round]);

  useEffect(() => {

    players.forEach(p => {
      p.set("vote", null);
    });
    round.set("allVoted", false);

  }, [round]);


  const calculatePlayerTotalBonus = () => {
    if (!submittedData_formal || !features) {
      return 0;
    }
    return features.reduce((total, feature) => {

      const isSelected = submittedData_formal.decisions[feature.name];
      const bonusAmount = isSelected ? feature.bonus[currentPlayerRole] : 0;
      return total + bonusAmount;
    }, 0);
  };



  const handleVote = (vote) => {

    const playerTotalBonus = calculatePlayerTotalBonus();
    const playerBonusesByRole = round.get("playerBonusesByRole") || {};
    const totalPoints = round.get("totalPoints");
    const role1 = players.find(p => p.get("role") === "role1").get("role");
    playerBonusesByRole[role1] = totalPoints;
    playerBonusesByRole[player.get("role")] = playerTotalBonus;
    round.set("playerBonusesByRole", playerBonusesByRole);

    if (vote === "For" && playerTotalBonus < 0) {
      // setModalMessage("This proposal will earn you a negative bonus, you are not allowed to accept it. Note if you do not reach agreement, you will still earn the base pay for the task.");
      // setShowModal(true)
      alert("Hello")
      return;
    }

    player.set("vote", vote);
    console.log("Vote set for", player.id, "to", vote);
    setTimeout(() => {
      console.log("Checking votes:");
      players.forEach(p => {
        console.log(p.id, p.get("vote"));
      });
      const allVotedCheck = players.every(p => p.get("vote") || p.get("role") === "role1");
      console.log("All voted:", allVotedCheck);
    }, 1000);

    //player.stage.set("submit", true);

    // Check if all players have voted
    const allPlayersVoted = players.every(p => p.get("vote") || p.get("role") === "role1");
    console.log(`allPlayersVoted`, allPlayersVoted);
    if (allPlayersVoted) {
      round.set("allVoted", true);
      round.set("pass", pass);
      const nonVoters = players.filter(p => !p.get("vote") && p.get("role") !== "role1").map(p => p.get("name"));
      round.set("nonVoters", nonVoters);
    };

  };
  // If all players have voted
  if (round.get("allVoted") || round.get("missingProposal")) {
    round.set("pass", pass);  // Save this round to see if it passes
    player.stage.set("submit", true);

  }

  // If the current player has already voted, or the player is "Stellar_Cove", then show wait
  if (player.get("vote") || player.get("role") === "role1") {
    return (
      <div className="container">
        <div className="waiting-section">
          <div className="loader"></div>
          <div>Other parties are still voting. Once votes are in and tallied, the results will be shown.</div>
        </div>
      </div>
    );
  }

  if (!submittedData_formal || !submittedData_formal.decisions) {
    round.set("missingProposal", true); // Set a status indicating that the proposal is missing

  }
  const decisionsMap = submittedData_formal.decisions
    ? Object.entries(submittedData_formal.decisions).reduce((acc, [feature, isSelected]) => {
      acc[feature] = isSelected;
      return acc;
    }, {})
    : {};

  window.features = features

  return (
    <div>
      <div className="text-brief-wrapper">
        <div className="text-brief">
          <h5>{role1} has made their final proposal.<br /><br />Time to cast your final vote!</h5>
        </div>
      </div>
      <br />

      <div className="table-container">
        <div className="table-wrapper">
          <table className="styled-table-orange">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Include</th>
                <th>Bonus</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => {
                const isSelected = selectedFeatureNames.includes(feature.name); // 检查特性是否被选中
                const isDesiredFeature = desiredFeaturesForRole.includes(feature.name);
                // 根据当前玩家角色计算奖励
                const bonusForCurrentPlayer = isSelected ? feature.bonus[player.get("role")] : "-";

                return (
                  <tr key={index} className={isDesiredFeature ? "selected-feature" : ""}>
                    <td>{feature.name}</td>
                    <td>{isSelected ? <span>&#10003;</span> : <span>&nbsp;</span>}</td>
                    <td>{bonusForCurrentPlayer}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="total-points-display">Your bonus: ${Math.round(calculatePlayerTotalBonus() * 100) / 100}</div>
        </div>
      </div>
      <br />
      <div className="buttons-container-vote">
        <Button handleClick={() => handleVote("For")}>Accept</Button>
        <Button handleClick={() => handleVote("Against")}>Reject</Button>
        <CustomModal show={showModal} handleClose={handleCloseModal} message={modalMessage} />
      </div>
    </div>
  );
};


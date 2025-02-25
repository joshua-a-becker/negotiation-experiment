
import React, { useEffect, useState } from "react";
import { usePlayer, usePlayers, useRound, useGame } from "@empirica/core/player/classic/react";
import './css/TableStyles.css';
import { useChat } from '../ChatContext';
import { Button } from "../components/Button";
import CustomModal from "./Modal";
import StrawPoll from "../components/StrawPoll";
import Header from "../components/Header";
import { useRef } from "react";

export function FormalVote() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const game = useGame();
  const { appendSystemMessage } = useChat();
  const notificationSentRef = useRef(false);
  
  const [submittedData, setSubmittedData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [gameEnded, setGameEnded] = useState(false);

  const isVoting = round.get("isVoting");
  const submittedData_formal = round.get("submittedData_formal");
  const totalPoints = round.get("totalPoints");

  const treatment = game.get("treatment");
  const proposalHistory = round.get("proposalHistory") || [];

  const formalProposals = proposalHistory.filter(proposal => proposal.isFormal);

  // Get the latest proposal
  const latestFormalProposal=
    formalProposals.length > 0
      ? formalProposals[formalProposals.length - 1]
      : null;

  //Check who has voted
  const whoVoted = latestFormalProposal?.formalVote
    ? latestFormalProposal.formalVote.flatMap(obj => Object.keys(obj))
    : [];
  const playerVoted = whoVoted.includes(player.get("role"));


  // Feature data
  const featureData = game.get("featureData")[treatment.scenario] || {};
  const features = featureData.features || [];



  const desiredFeaturesForRole = features
    .filter(feature => feature.bonus[player.get("role")] === 1)
    .map(feature => feature.name)
    .join(", ");

  const role1 = featureData.roleNames?.role1 || "";

  // End game function
  const endGame = () => {
    if (!gameEnded) {
      console.log("endGame executed");
      notificationSentRef.current = true; // Mark notification as sent
      setGameEnded(true);
      round.set("completed", true);
      game.set("summary", true);
    }
  };

  // Check for invalid proposal data and end game if needed
  // useEffect(() => {
  //   if (!gameEnded && (!latestFormalProposal?.submitterRole || !latestFormalProposal?.decisions)) {
  //     console.log("useEffect triggered endGame");
  //     endGame();
    
  //   }
  // }, []);
  useEffect(() => {
    console.log("Checking latest formal proposal in useEffect:", latestFormalProposal);
    if (!gameEnded && (!latestFormalProposal?.submitterRole || !latestFormalProposal?.decisions)){
      console.log("No formal proposal found, skipping to summary.");
      endGame();
    }
  }, [latestFormalProposal]);

  useEffect(() => {
    players.forEach(p => p.set("vote", null));
    round.set("allVoted", false);
  }, [round]);

  const calculatePoints = (selectedFeatures) => {
    return features.reduce((total, feature) => {
      const isSelected = selectedFeatures[feature.name];
      const roleBonus = feature.bonus[player.get("role")] || 0;
      return total + (isSelected ? roleBonus : 0);
    }, 0);
  };

  const handleVote = (vote) => {
    if (vote) {
      const playerScore = calculatePoints(latestFormalProposal.decisions);
      if (playerScore < 0) {
        setModalMessage(
          "This proposal will earn you a negative bonus, you are not allowed to accept it. Note that if you do not reach agreement, you will still earn the base pay for this task."
        );
        setShowModal(true);
        return;
      }
    }


    const role = player.get("role");
    const updatedProposalHistory = [...proposalHistory];
    updatedProposalHistory[updatedProposalHistory.length - 1].formalVote.push({ [role]: vote });
    round.set("proposalHistory", updatedProposalHistory);
    console.log("Updated Proposal History:", round.get("proposalHistory"));
  };

  if (!latestFormalProposal) {
    return (
      <div className="container">
        <h2>No formal proposals have been submitted yet.</h2>
        <p>Wait for a formal proposal before voting.</p>
      </div>
    );
  }

  const voteButtons = () => {
    return (
      <>
        <p>{latestFormalProposal?.submitterRole || "Unknown"} has made a FINAL proposal! See details below.</p>
        <p><br/>Value to you: <b>{parseFloat(calculatePoints(latestFormalProposal?.decisions || {})).toFixed(2)}</b></p>
        <p><br/>Please cast your final vote!<br/><br/></p>
        <div className="voting-buttons-container">
          <CustomModal
            show={showModal}
            handleClose={() => setShowModal(false)}
            message={modalMessage}
          />
          <Button
            className="vote-button"
            handleClick={() => handleVote(1)}
          >
            Accept
          </Button>
          <Button
            className="vote-button"
            handleClick={() => handleVote(0)}
          >
            Reject
          </Button>
        </div>
      </>
    );
  };

  if (playerVoted) {
    player.stage.set("submit", true);
    return (
      <div className="container">
        <div className="waiting-section">
          <div className="loader"></div>
          <p>Please wait while the other parties vote. Once votes are in and tallied, the results will be shown.</p>
        </div>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="summary-screen">
        <h1>The game has ended.</h1>
        <p>The proposal process was incomplete or invalid. Transitioning to the summary screen...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex" style={{ position: "relative" }}>
      <div className="h-full w-full flex flex-col">
        <div style={{ height: "90%", overflowY: "auto" }}>
          <Header
            message={voteButtons()}
            player={player}
            role1={role1}
            textRef={null}
            instructions={null}
          />
          <StrawPoll
            featureData={featureData}
            submissionData={latestFormalProposal}
            playerRole={player.get("role")}
            onChangeTotalBonus={() => {}}
          />
        </div>
      </div>
    </div>
  );
}



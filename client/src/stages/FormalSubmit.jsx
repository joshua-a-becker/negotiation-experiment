// //FormalSubmit.jsx
import React from "react";
import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import './css/TableStyles.css';
import { useState, useEffect } from 'react';
import { useGame } from "@empirica/core/player/classic/react";
import { useChat } from '../ChatContext';
import { Timer } from "../components/Timer";
import { useStageTimer } from "@empirica/core/player/classic/react";
import Calculator from "../components/Calculator"
import featureData from "../featureData"
import CustomModal from "./Modal"


const getLondonTime = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
  }).format(new Date()).split(/[\/,]/);

  return `${parts[2].trim()}-${parts[1]}-${parts[0]}:${parts[3].trim().replace(/:/g, '-')}`;
}

export function FormalSubmit() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const game = useGame();
  const { appendSystemMessage } = useChat();
  const [hasSubmittedProposal, setHasSubmittedProposal] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitterRole = player.get("role");
  const submittedData_formal = round.get("submittedData_formal");
  const timer = useStageTimer();
  let remainingSeconds = timer?.remaining ? Math.round(timer.remaining / 1000) : null;
  const treatment = game.get("treatment");

  if(round.get("formalProposalSubmitted")) {player.stage.set("submit",true)}

  const treatmentFeatureData = game.get("featureData")[treatment.scenario]
  const features = treatmentFeatureData.features

  const desiredFeaturesForRole = features
    .filter(feature => feature.bonus[player.get("role")] === 1)
    .map(feature => feature.name)
    .join(", ");

  const role1 = treatmentFeatureData === undefined ? "" :
    treatmentFeatureData.roleNames === undefined ? "" :
    treatmentFeatureData.roleNames['role1']


  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCloseModal = () => {
    setShowModal(false);
  };


  useEffect(() => {

    const reminders = [30];
    if (reminders.includes(remainingSeconds)) {
      const minutesLeft = remainingSeconds / 60;
      appendSystemMessage({
        id: `reminder-${remainingSeconds}`,
        text: "Reminder: 30 seconds left.",
        sender: {
          id: "system",
          name: "System",
          avatar: "",
          role: "System",
        }
      });
    }

    if (remainingSeconds === 10) {
      appendSystemMessage({
        id: `warning-${remainingSeconds}`,
        text: "WARNING: 10 seconds left. please finalize your proposal.",
        sender: {
          id: "system",
          name: "System",
          avatar: "",
          role: "System",
        }
      });
    }
  }, [remainingSeconds, appendSystemMessage]);



  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const handleSubmitProposal = (submission_data) => {
    
    console.log("submit")

    // check they're allowed to submit!!
    
    const playerScore = calculatePoints(submission_data.decisions)
    console.log(submission_data)
    console.log("SCORE: " + playerScore)
    if (playerScore <= 0) {
      setModalMessage(
        "This proposal will earn you a negative bonus, you are not allowed to accept it. Note that if you do not reach agreement, you will still earn the base pay for this task."
      );
      setShowModal(true);
   
      return;
    }
  
 

    // get history from server
    const proposalHistory = round.get("proposalHistory")

    // add Role 1 vote to submission (bc default vote=yes)
    submission_data.formalVote.push( {[player.get("role")]: 1})
    submission_data.type = "formal";
    submission_data.timestamp = getLondonTime();
    // add submission to history
    proposalHistory.push(submission_data);
    
    // update server data
    round.set("proposalHistory", proposalHistory)   


    const selectedFeatureNames = ["a","b"] //Object.entries(selectedFeatures).filter(([_, isSelected]) => isSelected).map(([featureName]) => featureName);
    const formalmessageText = `${role1} has submitted a formal proposal. Features Included are: ${selectedFeatureNames.join(", ")}.`;
    appendSystemMessage({
      id: generateUniqueId(),
      text: formalmessageText,
      sender: {
        id: Date.now(),
        name: "Notification",
        avatar: "",
        role: "Notification",
      }
    });

    // NOW LOG THAT THE PROPOSAL HAS BEEN SUBMITTED AND SUBMIT
    round.set("formalProposalSubmitted",true)
    player.stage.set("submit", true)
  }

  const calculatePoints = (selectedFeatures) => {
    const featuresToCalc = treatmentFeatureData.features


    const pointsReturn = featuresToCalc.reduce((total, feature) => {
        const isSelected = selectedFeatures[feature.name];
        const roleBonus = feature.bonus[player.get("role")] || 0;
        return (total + (isSelected ? roleBonus : 0));
    }, 0);

    return pointsReturn
  }


  const displaySubmit = player.get("role") === "role1"

    return (
      <div className="flex-container">
        <div className="flex-child">
          <CustomModal
            show={showModal}
            handleClose={handleCloseModal}
            message={modalMessage}
          />
          <div className="informal-text-brief-wrapper" style={{ marginTop: '100px' }}>
            <div className="informal-text-brief-1">
              <b>Your role:</b> {player.get("name")}.
              <br />Please wait while {role1} submits a final proposal for an official, binding vote.
            </div><br /><br /><br />
          </div>
          <div className="table-container">
            <Calculator
              featureData={treatmentFeatureData}
              showVoteButton={true}
              roleName={player.get("name")}
              playerRole={player.get("role")}
              displaySubmit={displaySubmit}
              propSelectedFeatures={{}}
              calculatePoints={calculatePoints}
              handleProposalSubmission={handleSubmitProposal}
              formalVote={true}
            />
          </div>
        </div>
      </div>
    );
  
}




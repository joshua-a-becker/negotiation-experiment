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


  const treatmentFeatureData = game.get("featureData")[treatment.scenario]
  const features = treatmentFeatureData.features

  const desiredFeaturesForRole = features
    .filter(feature => feature.bonus[player.get("role")] === 1)
    .map(feature => feature.name)
    .join(", ");

  const role1 = featureData === undefined ? "" :
    featureData.roleNames === undefined ? "" :
      featureData.roleNames['role1']

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


  useEffect(() => {
    setTotalPoints(calculateTotal());
  }, [selectedFeatures, player]);

  const handleOptionChange = featureName => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  const calculateTotal = () => {
    const role = player.get("role");
    return features.reduce((total, feature) => {
      const isSelected = selectedFeatures[feature.name];
      const roleBonus = feature.bonus[role] || 0;
      return total + (isSelected ? roleBonus : 0);
    }, 0);
  };

  const getSubmittedFeaturesAndBonuses = () => {
    if (!submittedData_formal) {
      return null;
    }
  };
  const submissionInfo = getSubmittedFeaturesAndBonuses();
  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;


  const handleSubmitProposal = (event) => {
    event.preventDefault();


    const hasSelectedFeatureformal = Object.values(selectedFeatures).some(isSelected => isSelected);
    if (!hasSelectedFeatureformal) {
      setModalMessage(
        "You must propose at least one feature to include in your product"
      );
      setShowModal(true);
      //alert("You must propose at least one feature to include in your product.");
      return;
    }

    const totalPoints = calculateTotal();

    // Check if the total bonus is negative
    if (totalPoints < 0) {
      setModalMessage(
        "This proposal will earn you a negative bonus, you are not allowed to propose a negative bonus proposal."
      );
      setShowModal(true);
      return; // Exit the function without submitting anything, allowing the user to reselect
    }

    const choices = Object.entries(selectedFeatures).reduce((acc, [feature, isSelected]) => {
      if (isSelected) acc[feature] = features.find(f => f.name === feature).bonus[player.get("role")];
      return acc;
    }, {});

    round.set("submittedData_formal", {
      playerID: player._id,
      decisions: choices,
      submitterRole: player.get("role")
    });
    setIsSubmitted(true);
    round.set("isSubmitted", true);
    setHasSubmittedProposal(true);
    round.set("isVoting", true);
    round.set("totalPoints", totalPoints);
    round.set("gonext", true);


    if (submitterRole === "role1") {
      const currentCount = game.get("submitCount") || 0;
      game.set("submitCount", currentCount + 1);
      const submissions = game.get("submissions") || [];
      submissions.push({
        submitter: submitterRole,
        choices,
        count: currentCount + 1
      });
      game.set("submissions", submissions);

    }

    const selectedFeatureNames = Object.entries(selectedFeatures).filter(([_, isSelected]) => isSelected).map(([featureName]) => featureName);
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
  };

  if (round.get("isSubmitted")) {
    player.stage.set("submit", true);
    return;
  }


  if (player.get("role") === "role1") {
    return (
      <div className="container">
        <div className="text-brief-wrapper">
          <div className="text-brief">
            <h6>Time to vote! Please offer a final proposal.<br /><br />The chat history contains informal vote results.</h6>
          </div>
        </div>
        <br />
        <div className="table-container">
          <div className="table-wrapper">
            <br />
            <table className="styled-table-orange">
              <thead>
                <tr >
                  <th>Feature</th>
                  <th>Include</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => {
                  const isDesiredFeature = desiredFeaturesForRole.split(", ").includes(feature.name);
                  return (
                    <tr key={index} className={isDesiredFeature ? "selected-feature" : ""}>
                      <td>{feature.name}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selectedFeatures[feature.name]}
                          onChange={() => handleOptionChange(feature.name)}
                        />
                      </td>
                      <td>
                        {selectedFeatures[feature.name] ?
                          <strong>{feature.bonus[player.get("role")]}</strong>
                          :
                          <div style={{ color: "#888888" }}>{feature.bonus[player.get("role")]}</div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="total-points-display"> Total bonus: ${Math.round(totalPoints * 100) / 100}</div>
            <br />
            {!hasSubmittedProposal && (
              <div className="button-container">

                <button onClick={handleSubmitProposal} className={"submit-button-orange"}>
                  Submit for Formal Vote
                </button>
                <CustomModal show={showModal} handleClose={handleCloseModal} message={modalMessage} />
              </div>
            )}
          </div>
        </div>

      </div>
    )

  } else {
    return (
      <div className="flex-container">
        <div className="flex-child">
          <div className="informal-text-brief-wrapper" style={{marginTop:'100px'}}> 
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
              displaySubmit={false}
              propSelectedFeatures={{}}
            />
          </div>
        </div>
      </div>
    );
  }
}




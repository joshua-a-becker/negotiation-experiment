
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
  
  // Get the latest proposal
  const latestProposal =
    proposalHistory.length > 0
      ? proposalHistory[proposalHistory.length - 1]
      : null;

  // Check who has voted
  const whoVoted = latestProposal?.formalVote
    ? latestProposal.formalVote.flatMap(obj => Object.keys(obj))
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
      // appendSystemMessage({
      //   id: `end-game-${Date.now()}`,
      //   text: "The game has ended due to invalid or incomplete proposals.",
      //   sender: {
      //     id: "system",
      //     name: "System",
      //     avatar: "",
      //     role: "System",
      //   },
      // });
    }
  };

  // Check for invalid proposal data and end game if needed
  useEffect(() => {
    if (!gameEnded && (!latestProposal?.submitterRole || !latestProposal?.decisions)) {
      console.log("useEffect triggered endGame");
      endGame();
    
    }
  }, []);

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
      const playerScore = calculatePoints(latestProposal.decisions);
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
  };

  const voteButtons = () => {
    return (
      <>
        <p>{latestProposal?.submitterRole || "Unknown"} has made a proposal! See details below.</p>
        <p>Value to you: <b>{calculatePoints(latestProposal?.decisions || {})}</b></p>
        <p>Please cast your final vote!</p>
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
          <p>Other parties are still voting. Once votes are in and tallied, the results will be shown.</p>
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
            submissionData={latestProposal}
            playerRole={player.get("role")}
            onChangeTotalBonus={() => {}}
          />
        </div>
      </div>
    </div>
  );
}


// // // //formalvote.jsx
// import React, { useEffect, useState } from "react";
// import { usePlayer, usePlayers, useRound, useGame } from "@empirica/core/player/classic/react";
// import './css/TableStyles.css';
// import { useChat } from '../ChatContext';
// import { Button } from "../components/Button";
// import CustomModal from "./Modal";
// import StrawPoll from "../components/StrawPoll";
// import Header from "../components/Header";

// export function FormalVote() {


//   const player = usePlayer();
//   const players = usePlayers();
//   const round = useRound();
//   const { appendSystemMessage } = useChat();
//   const game = useGame();
//   const [submittedData, setSubmittedData] = useState(null);
//   const isVoting = round.get("isVoting");
//   const submittedData_formal = round.get("submittedData_formal");
//   const pass = players.filter(p => p.get("role") !== "role1").every(p => p.get("vote") === "For");
//   const totalPoints = round.get("totalPoints");
//   const selectedFeatureNames = submittedData_formal ? Object.keys(submittedData_formal.decisions).join(", ") : "No features selected";
//   const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
//   const allPlayersVoted = players.every(p => p.get("vote") || p.get("role") === "role1");
//   const forVotes = players.filter(p => p.get("vote") === "For").length;
//   const againstVotes = players.filter(p => p.get("vote") === "Against").length;
//   const formalresultText = `Formal Voting Results: ${forVotes + 1} Accept, ${againstVotes} Reject. ` + (pass ? "The proposal has been accepted." : "The proposal has not been accepted.");
//   const treatment = game.get("treatment");

//   window.round=round;

//   const [showModal, setShowModal] = useState(false);
//   const [modalMessage, setModalMessage] = useState('');

//   const handleCloseModal = () => {
//     setShowModal(false);
//   };


//   const proposalHistory = round.get("proposalHistory") 
//   // const latestProposal = proposalHistory[Object.keys(proposalHistory)[Object.keys(proposalHistory).length - 1]]

//   // const whoVoted = latestProposal.formalVote.flatMap(obj => Object.keys(obj));

//   //Ensure proposalHistory exists and has elements

//   const latestProposal = proposalHistory && Object.keys(proposalHistory).length > 0
//   ? proposalHistory[Object.keys(proposalHistory)[Object.keys(proposalHistory).length - 1]]
//   : null;

//   const whoVoted = latestProposal && latestProposal.formalVote
//   ? latestProposal.formalVote.flatMap(obj => Object.keys(obj))
//   : [];

//   const playerVoted = whoVoted.includes(player.get("role"))

//   const featureData = game.get("featureData")[treatment.scenario]

//   const features = featureData === undefined ? undefined : featureData.features


//   const desiredFeaturesForRole = features === undefined ? undefined :
//     features.filter(feature => feature.bonus[player.get("role")] === 1)
//       .map(feature => feature.name)
//       .join(", ");

//   const currentPlayerRole = player.get("role");

//   const role1 = featureData === undefined ? "" :
//     featureData.roleNames === undefined ? "" :
//       featureData.roleNames['role1']

//   useEffect(() => {
//     const dataFormal = round.get("submittedData_formal");
//     if (dataFormal) {
//       setSubmittedData(dataFormal);
//     }
//   }, [round]);

//   useEffect(() => {

//     players.forEach(p => {
//       p.set("vote", null);
//     });
//     round.set("allVoted", false);

//   }, [round]);


//   const calculatePlayerTotalBonus = () => {
//     return -1;
//   };

//   const calculatePoints = (selectedFeatures) => {
//     const featuresToCalc = featureData.features
//     const roleToCalc = player.get("role")

//     const pointsReturn = featuresToCalc.reduce((total, feature) => {
//         const isSelected = selectedFeatures[feature.name];
//         const roleBonus = feature.bonus[roleToCalc] || 0;
//         return (total + (isSelected ? roleBonus : 0));
//     }, 0);

//     return ( Number(pointsReturn.toFixed(1)) );
//   };



//   const handleVote = (vote) => {

//     // CHECK IF THEY'RE ALLOWED TO VOTE YES!
//     if(vote) {
//      const playerScore = calculatePoints(latestProposal.decisions)
//      if (playerScore < 0) {
//        setModalMessage(
//          "This proposal will earn you a negative bonus, you are not allowed to accept it. Note that if you do not reach agreement, you will still earn the base pay for this task."
//        );
//        setShowModal(true);
//        console.log("stop!")
//        return;
//      }
//    }


//    console.log("official")
//    const role = player.get("role")
//    const proposalHistory = round.get("proposalHistory")
//    proposalHistory[proposalHistory.length-1].formalVote.push( {[role]: vote})
//    console.log(proposalHistory)
//    round.set("proposalHistory", proposalHistory)   

//  };




//   const voteButtons = () => {
//     const proposer = latestProposal.submitterRole
//     return (
//       <>
//         {proposer} has made a proposal! See details below.
//         <br />
//         <br />
//         Value to you: <b>{calculatePoints(latestProposal.decisions)}</b>
//         <br />
//         <br />
//         Please cast your final vote!
//         <br />
//         <br />
//         <div className="voting-buttons-container">
//           <CustomModal
//             show={showModal}
//             handleClose={handleCloseModal}
//             message={modalMessage}
//           />
//           <Button
//             className="vote-button"
//             handleClick={() => handleVote(1)}
//           >
//             Accept
//           </Button>
//           <Button
//             className="vote-button"
//             handleClick={() => handleVote(0)}
//           >
//             Reject
//           </Button>
//         </div>
//       </>
//     );
//   }

 
//   if (playerVoted) {
//     player.stage.set("submit",true)
//     return (
//       <div className="container">
//         <div className="waiting-section">
//           <div className="loader"></div>
//           <div>Other parties are still voting. Once votes are in and tallied, the results will be shown.</div>
//         </div>
//       </div>
//     );
//   }

 
//   const setTotalBonus = (number) => {
//     //setValue(number);
//   };

//   const calcHeaderMessage = () => {
//     return(
//       voteButtons()
//     )
//   }


//   window.features = features
  

//   return (
//     <>
//       <div className="h-full w-full flex" style={{ position: "relative" }}>
//         <div className="h-full w-full flex flex-col">
//           <div style={{ height: "90%", overflowY: "auto" }}>
//             <Header
//               message={calcHeaderMessage()}
//               player={player}
//               role1={role1}
//               textRef={null}
//               instructions={null}
//             />
//             <br/>
//             <StrawPoll
//               featureData={featureData}
//               submissionData={latestProposal}
//               playerRole={player.get("role")}
//               onChangeTotalBonus={setTotalBonus}
//             />
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };


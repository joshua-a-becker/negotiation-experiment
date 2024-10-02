import { usePlayer, useRound, useGame } from "@empirica/core/player/classic/react";
import { usePlayers } from "@empirica/core/player/classic/react";
import React from "react";
import { useContext } from "react";
import { Button } from "../components/Button";
import './css/TableStyles.css';
import { useState, useEffect } from 'react';
import { useChat } from '../ChatContext';
import { Timer } from "../components/Timer";
import { useStageTimer } from "@empirica/core/player/classic/react";
import { isDevelopment } from "@empirica/core/player"
import Calculator from "../components/Calculator"
import StrawPoll from "../components/StrawPoll"
import CustomModal from './Modal';
import { ScrollContext } from "../components/ScrollContext";


export function Choice() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const game = useGame();
  const { appendSystemMessage } = useChat();
  const timer = useStageTimer();
  const [submissionData, setSubmissionData] = useState(player.get("submissionData"));
  const textRef = useContext(ScrollContext);

  let remainingSeconds = timer?.remaining ? Math.round(timer.remaining / 1000) : null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlDev = urlParams.get("urlDev");

  const [showTaskBrief, setShowTaskBrief] = useState(false);
  const handleShowTaskBrief = () => setShowTaskBrief(true);
  const handleCloseTaskBrief = () => setShowTaskBrief(false);
  const treatment = game.get("treatment");

  window.playerRole = player.get("role");

  const featureData = game.get("featureData") === undefined ? undefined : game.get("featureData")[treatment.scenario]
  const features = featureData === undefined ? undefined : featureData.features
  const productName = featureData === undefined ? undefined : featureData.product_name


  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const [totalPoints, setTotalPoints] = useState(0);

  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [votes, setVotes] = useState({});
  const anySubmitted = round.get("anySubmitted");

  const submittedData_informal = round.get("submittedData_informal");
  const nextClicked = round.get("nextClicked");
  const votingCompleted = round.get("votingCompleted");
  const submittedInformalVote = round.get("submittedInformalVote")

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCloseModal = () => {
    setShowModal(false);
  };




  window.featureData = featureData

  player.set("name",
    featureData === undefined ? "" :
      featureData.roleNames === undefined ?
        "" : featureData.roleNames[player.get("role")]
  )
  const role1 = featureData === undefined ? "" :
    featureData.roleNames === undefined ? "" :
      featureData.roleNames['role1']


  const [showInstructionsModal, setShownInstructionsModel] = useState(true);


  //-----------------------------------------------------------------------------------------------------------------------


  //reset， only for test

  const resetVotes = () => {
    const resetVotes = { role1: null, role2: null, role3: null };

    round.set("votesFormal", resetVotes);

    round.set("proposalOutcome", null);

    setLocalProposalStatus(null);

    console.log("All votes and proposal outcomes have been reset");
  };

  //before starting


  if (round.get("proposalOutcome") === undefined) {
    round.set("proposalOutcome", null);
  }

  const [localProposalStatus, setLocalProposalStatus] = useState(null);



  function calculateRoleScoresFromLatestSubmission(history, features) {

    const roleScores = { role1: 0, role2: 0, role3: 0 };
    if (history.length > 0) {
      const latestSubmission = history[history.length - 1]; // 获取最新的提交
      const productNames = Object.keys(latestSubmission.decisions);

      productNames.forEach(name => {
        const feature = features.find(feature => feature.name === name);
        if (feature) {
          roleScores.role1 += feature.bonus.role1;
          roleScores.role2 += feature.bonus.role2;
          roleScores.role3 += feature.bonus.role3;
        }
      });
    }

    return roleScores;
  }


  const ph = round.get("proposalHistory")


  const handleMakeOfficial = () => {

    const roleScores = calculateRoleScoresFromLatestSubmission(ph, featureData.features);
    const playerRole = player.get("role")
    console.log("TRYING")
    console.log(roleScores)
    if (roleScores[playerRole] < 0) {
      setModalMessage(
        "This proposal will earn you a negative bonus, you are not allowed to accept it. Note that if you do not reach agreement, you will still earn the base pay for this task."
      );
      setShowModal(true);
      console.log("stop!")
      return;
    }

    window.roleScores = roleScores

    console.log("TESTBONUS: " + roleScores);


    const currentVotes = round.get("votesFormal") || { role1: null, role2: null, role3: null };
    console.log(`Before updating, ${playerRole} votes:`, currentVotes);

    const updatedVotes = { ...currentVotes, [playerRole]: true };
    round.set("votesFormal", updatedVotes);

    console.log(`After updating, ${playerRole} votes:`, updatedVotes);

    checkAllVotes(updatedVotes);
  };

  const handleRejectOfficial = () => {
    const playerRole = player.get("role");
    const currentVotes = round.get("votesFormal") || { role1: null, role2: null, role3: null };
    console.log(`Before updating, ${playerRole} votes:`, currentVotes);

    const updatedVotes = { ...currentVotes, [playerRole]: false };
    round.set("votesFormal", updatedVotes);

    console.log(`After updating, ${playerRole} votes:`, updatedVotes);
    checkAllVotes(updatedVotes);

  };

  const checkAllVotes = (votes) => {

    const calculateAndUpdateBonuses = () => {
      const playerTotalBonus = calculatePlayerTotalBonus();
      const playerBonusesByRole = round.get("playerBonusesByRole") || {};
      const totalPoints = round.get("totalPoints");
      const role1 = players.find(p => p.get("role") === "role1").get("role");
      playerBonusesByRole[role1] = totalPoints;
      playerBonusesByRole[player.get("role")] = playerTotalBonus;
      round.set("playerBonusesByRole", playerBonusesByRole);

      console.log("Updated playerBonusesByRole£3333:", round.get("playerBonusesByRole"));
    };

    const allVoted = Object.values(votes).every(vote => vote !== null);
    if (allVoted) {
      const anyRejected = Object.values(votes).some(vote => vote === false);
      if (anyRejected) {
        console.log("The official proposal did not pass.");

        round.set("proposalOutcome", "failed");
        setLocalProposalStatus("failed");

        appendSystemMessage({
          id: `vote-failure-${Date.now()}`,
          text: "Sorry, this official proposal did not pass.",
          sender: {
            id: "system",
            name: "System",
            avatar: "",
            role: "System",
          }
        });

      } else {
        console.log("The official proposal passed.");

        round.set("proposalOutcome", "passed");
        setLocalProposalStatus("passed");

        appendSystemMessage({
          id: `vote-success-${Date.now()}`,
          text: "Congratulations, every participant agrees to put the latest proposal forward for an official vote.",
          sender: {
            id: "system",
            name: "System",
            avatar: "",
            role: "System",
          }
        });

        calculateAndUpdateBonuses();

      }
    }
  };


  const handleContinue_goend = () => {

    round.set("goendTriggered");
    console.log("Go end triggered, preparing to move.");


  };

  //------------------------------------------------------------------------------------------------------------------------

  // set the proposal status data from the round variable
  // or set to a blank proposal, if the round variable is undefined
  const proposalStatusData = round.get("proposalStatus") === undefined ?
    { status: false, content: "" }
    :
    round.get("proposalStatus")

  // set the proposal displayed in the straw poll component
  const strawPollContent = proposalStatusData === undefined ?
    undefined
    :
    proposalStatusData.content === undefined ? undefined : proposalStatusData.content.proposal

  // determine whether player has already voted, conditional on an open poll
  const currentlyVoted = proposalStatusData === undefined ? undefined :
    proposalStatusData.content.proposal === undefined ? undefined :
      proposalStatusData.content.proposal.vote === undefined ?
        undefined
        :
        proposalStatusData.content.proposal.vote.filter(v => Object.keys(v)[0] === player.get("role"))
          .length > 0

  // calculate player's current vote
  const currentVote = !currentlyVoted ? undefined :
    proposalStatusData.content.proposal.vote.filter(v => Object.keys(v)[0] === player.get("role"))[0][player.get("role")]


  // set message shown in straw poll component 
  // depending on proposal status and content
  const votesFormal = round.get("votesFormal") || { role1: null, role2: null, role3: null };

  const strawPollMessage = proposalStatusData === undefined ?
    undefined
    :
    proposalStatusData.status ?
      currentlyVoted ?
        <>
          Please wait for others to vote
        </>
        :
        <div ref={textRef} style={{
          marginTop: '10px',
          padding: '20px',
          background: '#f9f9f9',
          border: '1px solid #ddd',
        }}>
          <p>  "Please cast an informal vote."</p>

        </div>
      :


      <div className="container">
        {round.get("proposalOutcome") === "failed" ? (
          <>
            <div>Sorry, you did not agree to make this proposal official, please continue submit informal proposal.</div>
          </>
        ) : round.get("proposalOutcome") === "passed" ? (
          <>
            {/* <div>Please click the Continue button to go to the Summary Pages.</div> */}
            <Button className="continue-button" handleClick={() => {
              player.stage.set("submit", true);
              // round.set("goendTriggered", true);
              // game.set("goendTriggered", true);
              // player.set("goendTriggered", true);
              // player.set("officialproposal", NA_Early_Vote)
              // round.set("pass", pass);
              // game.set("pass", true);
              console.log("Go end triggered, preparing to move.")
            }}

            > Continue Make your final vote </Button>

          </>
        ) : votesFormal[player.get("role")] !== null ? (
          //  <div className="waiting-section">
          <div>
            <div className="loader"></div>
            <div>Other parties are still voting. Once votes are in and tallied, the results will be shown.</div>
          </div>
        ) : (
          <>

            {proposalStatusData.content.proposal === undefined ?
              "status false undefined"
              : <>
                PROPOSAL {proposalStatusData.content.proposal.result.for === treatment.playerCount ? (
                  <>
                    "PASSED (unofficial)"
                    <br />
                    "Would you like to make this official?"
                    <div className="voting-buttons-container">
                      <Button className="vote-button" handleClick={handleMakeOfficial}>Yes</Button>
                      <CustomModal show={showModal} handleClose={handleCloseModal} message={modalMessage} />
                      <Button className="vote-button" handleClick={handleRejectOfficial}>No</Button>
                    </div>
                  </>
                ) : <>
                  "REJECTED"
                  <br />
                  Yes: {proposalStatusData.content.proposal.result.for} &nbsp;&nbsp;&nbsp;&nbsp; No: {proposalStatusData.content.proposal.result.against}
                </>
                }
              </>
            }


          </>
        )}
      </div>


  // code for handling countdown reminder notifications
  useEffect(() => {
    const reminders = [300, 120]; // 剩余时间提醒点
    if (reminders.includes(remainingSeconds)) {
      const minutesLeft = remainingSeconds / 60; // 将秒转换为分钟
      appendSystemMessage({
        id: `reminder-${remainingSeconds}`,
        text: `Reminder: ${minutesLeft} Minute${minutesLeft > 1 ? 's' : ''} left.`,
        sender: {
          id: "system",
          name: "System",
          avatar: "",
          role: "System",
        }
      });
    }

    if (remainingSeconds === 60) {
      appendSystemMessage({
        id: `warning-${remainingSeconds}`,
        text: "WARNING: 1 Minute left. Please finalize your list of proposed features for official voting.",
        sender: {
          id: "system",
          name: "System",
          avatar: "",
          role: "System",
        }
      });
    }
  }, [remainingSeconds, appendSystemMessage]);

  const handleInstructionsModal = function () {
    setShownInstructionsModel(!showInstructionsModal)
  }

  // handle a vote click from the StrawPoll component
  const handleVoteSubmit = (vote) => {

    var locProposalStatus = proposalStatusData

    const checkCurrentVote = proposalStatusData.content.proposal === undefined ? undefined :
      proposalStatusData.content.proposal.vote === undefined ?
        undefined
        :
        proposalStatusData.content.proposal.vote.filter(v => Object.keys(v)[0] === player.get("role")).length > 0

    if (checkCurrentVote) {
      return
    }
    const vote_record = { [player.get("role")]: vote }

    if (locProposalStatus.content.proposal.vote === undefined) {
      locProposalStatus.content.proposal.vote = [vote_record]
    } else {
      locProposalStatus.content.proposal.vote.push(vote_record)
    }

    round.set("proposalStatus", locProposalStatus)

  }

  const handleOptionChange = featureName => {

  };

  const handleSubmitProposal = (submission_data) => {

    // Reset proposalOutcome to null each time a new proposal is submitted
    round.set("proposalOutcome", null);
    const resetVotes = { role1: null, role2: null, role3: null };
    round.set("votesFormal", resetVotes);

    const ph = round.get("proposalHistory")
    console.log("Current proposal history:", ph);
    ph.push(submission_data)
    round.set("proposalHistory", ph)
    game.set("proposalHistory", ph)

    round.set("proposalStatus", {
      status: true,
      content: {
        proposal: submission_data,
        vote: []
      }
    })
    console.log("Updated proposal history:", round.get("proposalHistory"));
    console.log("proposalStatusSSS:", round.get("proposalStatus"))


    function extractProductNames(history) {
      const productNames = [];
      history.forEach(submission => {
        const names = Object.keys(submission.decisions);
        productNames.push(...names);
      });
      return productNames;
    }


    function calculateRoleScoresFromLatestSubmission(history, features) {
      const roleScores = { role1: 0, role2: 0, role3: 0 };
      if (history.length > 0) {
        const latestSubmission = history[history.length - 1]; // 获取最新的提交
        const productNames = Object.keys(latestSubmission.decisions);

        productNames.forEach(name => {
          const feature = features.find(feature => feature.name === name);
          if (feature) {
            roleScores.role1 += feature.bonus.role1;
            roleScores.role2 += feature.bonus.role2;
            roleScores.role3 += feature.bonus.role3;
          }
        });
      }

      return roleScores;
    }

    const roleScores = calculateRoleScoresFromLatestSubmission(ph, featureData.features);

    console.log("Role Scores:", roleScores);
    game.set("roleScores", roleScores);
    console.log("round get test", game.get("roleScores"));

    round.set("anySubmitted", true);
    setProposalSubmitted(true);
    round.set("submittedData_informal", {
      playerID: player._id,
      decisions: submission_data.decisions,
      submitterRole: submission_data.submitterRole
    });
    console.log("Submitted Data (Informal):", round.get("submittedData_informal"));// we can get the specific bonus here 

    round.set("submittedInformalVote", true);

    const messageText = `${submission_data.submitterRole} initiated an Informal Vote.`;
    appendSystemMessage({
      id: generateUniqueId(),
      text: messageText,
      sender: {
        id: Date.now(),
        name: "Notification",
        avatar: "",
        role: "Notification",
      }
    });
    console.log({ featureData })
  };


  const header =


    <div className="informal-text-brief-1" style={{ position: "relative", marginTop: '20px' }}>
      <div
        className="modal-closer"
        onClick={handleInstructionsModal}
      >
        {showInstructionsModal ? <b>X</b> : "▼"}
      </div>
      <h6><strong>INSTRUCTIONS</strong></h6>
      {showInstructionsModal && (<>
        <br />
        <h6>Submit as many informal proposals as you want below.</h6>
        <h6><br />The calculator shows what proposal is worth.</h6>
        <br />
        <h6>{'role1' === player.get("role") ? "As " + role1 + ", you" : "At the end, " + role1} will submit a final proposal {'role1' === player.get("role") ? "at the end." : ""}</h6>
        <h6><br /><strong>You ALL must agree for the final proposal to pass!</strong></h6>

      </>)}
    </div>


  return (
    <>
      <div className="h-full w-full flex" style={{ position: 'relative' }}>
        <div className="h-full w-full flex flex-col">
          <div style={{ height: '90%', overflowY: 'auto' }}>
            <div className="informal-text-brief-wrapper" style={{ position: "relative" }}>
              {header}
            </div>
            <br />
            <br />
            <div className="table-container">

              <StrawPoll
                featureData={featureData}
                submissionData={strawPollContent}
                handleVoteSubmission={handleVoteSubmit}
                CurrentVote={currentVote}
                message={strawPollMessage}
                playerRole={player.get("role")}
              />
              <Calculator
                featureData={featureData}
                handleProposalSubmission={handleSubmitProposal}
                roleName={player.get("name")}
                displaySubmit={!proposalStatusData.status}
                propSelectedFeatures={player.get("selectedFeatures") ? player.get("selectedFeatures") : {}}
                handleOptionChange={handleOptionChange}
                playerRole={player.get("role")}

              />


              {isDevelopment && urlDev && (
                <>
                  {/*
                    <Button className="reset-button" handleClick={resetVotes} >Reset Votes</Button>
                  */}

                  <Button handleClick={() => player.stage.set("submit", true)}>
                    Continue
                  </Button>
                  {/*
                  <Button handleClick={() => { round.set("watchValue", round.get("watchValue") + 1); console.log(round.get("watchValue")) }}>
                    Click Me
                  </Button> 
                  */}
                </>
              )}


            </div>


          </div>
        </div>
      </div>
    </>
  );
}
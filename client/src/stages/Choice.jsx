import { isDevelopment } from "@empirica/core/player";
import { useRef } from 'react';
import {
  useGame,
  usePlayer,
  usePlayers,
  useRound,
  useStageTimer,
} from "@empirica/core/player/classic/react";
import React, { useContext, useEffect, useState } from "react";
import { useChat } from "../ChatContext";
import { Button } from "../components/Button";
import Calculator from "../components/Calculator";
import Header from "../components/Header";
import { ScrollContext } from "../components/ScrollContext";
import StrawPoll from "../components/StrawPoll";
import "./css/TableStyles.css";
import CustomModal from "./Modal";


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

export function Choice() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const game = useGame();
  const treatment = game.get("treatment");

  const calculatorRef = useRef();

  const { appendSystemMessage } = useChat();
  const timer = useStageTimer();

  const playerCount = treatment.playerCount;
  
  const textRef = useContext(ScrollContext);

  const [isMounted, setIsMounted] = useState(false);

  const ukTime = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  const [forceUpdate, setForceUpdate] = useState(false);
  const [value, setValue] = useState();

  if (forceUpdate) {
    setForceUpdate(false);
  }

  let remainingSeconds = timer?.remaining
    ? Math.round(timer.remaining / 1000)
    : null;

  const urlParams = new URLSearchParams(window.location.search);

  const urlDev = urlParams.get("urlDev");

  const featureData =
    game.get("featureData") === undefined
      ? undefined
      : game.get("featureData")[treatment.scenario];

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("")

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // const timeStamp = new Date()
  // console.log("date", timeStamp)

  player.set("name",
    featureData === undefined ? "" :
      featureData.roleNames === undefined ?
        "" : featureData.roleNames[player.get("role")]
  )
  const role1 = featureData === undefined ? "" : featureData.roleNames === undefined ? "" : featureData.roleNames["role1"];
  const role4 = featureData === undefined ? "" : featureData.roleNames === undefined ? "" : featureData.roleNames["role4"];
  
  const ph = round.get("proposalHistory") 
  const latestProposal = ph[Object.keys(ph)[Object.keys(ph).length - 1]]
  

  const latestProposalTimestamp = latestProposal === undefined ? "NA" : latestProposal.timestamp;

  

  function calculateRoleScoresFromLatestSubmission(history, features) {
    const roleScores = { role1: 0, role2: 0, role3:0};
    if (history.length > 0) {
      const latestSubmission = history[history.length - 1]; // 获取最新的提交
      const productNames = Object.keys(latestSubmission.decisions);

      productNames.forEach((name) => {
        const feature = features.find((feature) => feature.name === name);
        if (feature) {
          roleScores.role1 += feature.bonus.role1;
          roleScores.role2 += feature.bonus.role2;
          roleScores.role3 += feature.bonus.role3;

        }
      });
    }

    return roleScores;
  }


  const handleFormalVote = (vote) => {

    // CHECK IF THEY'RE ALLOWED TO VOTE YES!
    if(vote) {
      const playerScore = calculatePoints(latestProposal.decisions)
      if (playerScore <= 0) {
        setModalMessage(
          "This proposal will earn you a " + (playerScore<0 ? "negative" : "zero") +" bonus, you are not allowed to accept it. Note that if you do not reach agreement, you will still earn the base pay for this task."
        );
        setShowModal(true);
        
        return;
      }
    }

    const role = player.get("role")
    
    const proposalHistory = round.get("proposalHistory")
    proposalHistory[proposalHistory.length-1].formalVote.push( {[role]: vote})
    
    round.set("proposalHistory", proposalHistory)   
  };

 

  const informalVoteButtons = () => {
    const proposer = latestProposal.submitterRole
    return (
      <>
        {proposer} has made a proposal! See details below.
        <br />
        <br />
        Value to you: <b>{calculatePoints(latestProposal.decisions).toFixed(1)}</b>
        <br />
        <br />
        Please cast an informal vote.
        <br />
        <br />
        <div className="voting-buttons-container">
          <Button
            className="vote-button"
            handleClick={() => handleInformalVote(1)}
          >
            Accept
          </Button>
          <Button
            className="vote-button"
            handleClick={() => handleInformalVote(0)}
          >
            Reject
          </Button>
        </div>
      </>
    );
  }

  const formalVoteButtons = () => {

    const proposalValue = calculatePoints(latestProposal.decisions)

    return(
      <>
        Passed (unofficial)
        <br />
        <br />
        Value to you: <b>{proposalValue.toFixed(2)}</b>
        <br />
        <br />
        Would you like to make this official?
        <br />
        <br />
        <div className="voting-buttons-container">
          <Button
            className="vote-button"
            handleClick={() => handleFormalVote(1)}
          >
            Yes
          </Button>
          <CustomModal
            show={showModal}
            handleClose={handleCloseModal}
            message={modalMessage}
          />
          <Button
            className="vote-button"
            handleClick={() => handleFormalVote(0)}
          >
            No
          </Button>
        </div>
      </>
    )
  }

  const calcDisplaySubmit = () => {
    // POSSIBLE STATES
    // no proposal | SHOW
    // informal vote open | HIDE
    // informal vote failed | SHOW
    // formal vote open | HIDE
    // formal vote failed | SHOW


    //  NO PROPOSAL YET
    if(latestProposal===undefined) { 
      return true; 
    }

    // INFORMAL VOTE FAILED
    if(latestProposal.informalVote.length==playerCount) {          
      const informalVoteCount = latestProposal.informalVote
        .flatMap(obj => Object.values(obj))
        .reduce((sum, val) => sum + Number(val), 0);
        if(informalVoteCount < playerCount) {
          return true;
        }      
    }

    // FORMAL VOTE FAILED
    if(latestProposal.formalVote.length == playerCount) {
      const formalVoteCount = latestProposal.formalVote
      .flatMap(obj => Object.values(obj))
      .reduce((sum, val) => sum + Number(val), 0);
      
      // return <div>Please wait for others to vote</div>;
      if(formalVoteCount<playerCount) {
        return true;
      }
    }

    return false;
  }

  const calcHeaderMessage = () => {

    // POSSIBLE STATES
    // no proposal
    // proposal, informal vote incomplete, user didn't vote | show informal vote button
    // proposal, informal vote incomplete, user voted | show waiting for votes
    // proposal, informal vote complete, informal rejected | sorry didn't pass
    // proposal, informal vote completed & passed, formal vote incomplete, user didn't vote | show formal vote button
    // proposal, formal vote completed & not passed | sorry didn't pass
    // proposal, formal vote completed & passed | congrats


    //  NO PROPOSAL YET
    if(latestProposal===undefined) { 
      return undefined; 
    }


    // INFORMAL VOTE NOT YET COMPLETE
    if(latestProposal.informalVote.length<playerCount) {

      const voted = latestProposal.informalVote.flatMap(obj => Object.keys(obj));

      if(voted.includes(player.get("role"))) {
        return("Waiting for others to vote..")
      } else {
        // vote required
        return(informalVoteButtons())
      }      
    }

    // THE INFORMAL VOTE IS COMPLETE


    // INFORMAL VOTE FAILED
    const informalVoteCount = latestProposal.informalVote
      .flatMap(obj => Object.values(obj))
      .reduce((sum, val) => sum + Number(val), 0);


    if(informalVoteCount < playerCount) {
      return (
        <>
          {" "}
          Vote Failed (Unofficial)<br />
          Yes: {informalVoteCount} &nbsp;&nbsp;&nbsp;&nbsp; No: {playerCount - informalVoteCount}
        </>
      );
    }


    //FORMAL VOTE IS STILL OPEN
    if(latestProposal.formalVote.length < playerCount) {
      const voted = latestProposal.formalVote.flatMap(obj => Object.keys(obj));
      
      if(voted.includes(player.get("role"))) {
        return("Waiting for others to vote..")
      } else {
        // vote required
        return(formalVoteButtons())
      }      
    }

    // FORMAL VOTE IS COMPLETE
    
    const formalVoteCount = latestProposal.formalVote
      .flatMap(obj => Object.values(obj))
      .reduce((sum, val) => sum + Number(val), 0);


      
      // return <div>Please wait for others to vote</div>;


    if(formalVoteCount<playerCount) {
      return(
        <>
          Rejected
          <br />
          <br />
          Yes: {formalVoteCount}{" "}
          &nbsp;&nbsp;&nbsp;&nbsp; No:{" "}
          {playerCount-formalVoteCount}
        </>
      )
    } else if(formalVoteCount==playerCount) {
      return("Congratulations!  You have reached agreement!")
    }
      return("unexpected condition, please report ERROR Choice.jsx 224")
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  useEffect(() => {
    
    if (!isMounted) return;
    if(latestProposalTimestamp.toLowerCase()==='na') return;
    if (calculatorRef.current && treatment.calculatorAnchoring.toLowerCase()==="group") {
      calculatorRef.current.Set(latestProposal.decisions);
    }
  }, [latestProposalTimestamp, isMounted]);

  // code for handling countdown reminder notifications
  useEffect(() => {
    const reminders = [300, 120];
    if (reminders.includes(remainingSeconds)) {
      const minutesLeft = remainingSeconds / 60;
      appendSystemMessage({
        id: `reminder-${remainingSeconds}`,
        text: `Reminder: ${minutesLeft} Minute${minutesLeft > 1 ? "s" : ""
          } left.`,
        sender: {
          id: "system",
          name: "System",
          avatar: "",
          role: "System",
        },
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
        },
      });
    }
  }, [remainingSeconds, appendSystemMessage]);


  const setTotalBonus = (number) => {
    setValue(number);
  };

  // handle an INFORMAL vote
  const handleInformalVote = (vote) => {
    const role = player.get("role")
    const proposalHistory = round.get("proposalHistory")
    proposalHistory[proposalHistory.length-1].informalVote.push( {[role]: vote})
    
    round.set("proposalHistory", proposalHistory)
    
  };

  const handleOptionChange = (featureName) => { };

  const handleSubmitProposal = (submission_data) => {

    // HERE WE IMPLEMENT THE 'BLANK' FACTOR
    // THAT DETERMINES CALCULATOR RESET
    // SELF (defalt):  proposal stays in calculator
    // GROUP: submitted proposal fills everyone's calculator
    // BLANK: calculator resets to blank

    if(treatment.calculatorAnchoring) {
      if(treatment.calculatorAnchoring.toLowerCase()==="blank") {
        calculatorRef.current.Set({});
      }  
    }

    submission_data.type = "informal";
    submission_data.timestamp = getLondonTime();

    const prevProposalHistory = round.get("proposalHistory")
    

    prevProposalHistory.push(submission_data);
    round.set("proposalHistory", prevProposalHistory)

    /// add proposal to chat history
    /// but onlf if it's toggled!

    console.log("P IN CHAT")
    console.log(treatment.proposalInChat)
    if(treatment.proposalInChat==="yes")
    {
      round.append("chat", {
        text: prevProposalHistory.length,
        id: prevProposalHistory.length,
        sender: {
          Time: ukTime,
          id: Date.now(),
          role: "PROPOSAL",
          name: "PROPOSAL",
        },
      });
    }
  };

  // helper function to calculate points
  const calculatePoints = (selectedFeatures) => {
    const featuresToCalc = featureData.features
    const roleToCalc = player.get("role")

    const pointsReturn = featuresToCalc.reduce((total, feature) => {
        const isSelected = selectedFeatures[feature.name];
        const roleBonus = feature.bonus[roleToCalc] || 0;
        return (total + (isSelected ? roleBonus : 0));
    }, 0);

    return ( Number(pointsReturn.toFixed(2)) );
  };



  return (
    <>
      <div className="h-full w-full flex" style={{ position: "relative" }}>
        <div className="h-full w-full flex flex-col">
          <div style={{ height: "90%", overflowY: "auto" }}>
            <Header
              message={calcHeaderMessage()}
              player={player}
              role1={role1}
              textRef={textRef}
            />
            <br />
            <br />
            <div className="table-container">
              <StrawPoll
                featureData={featureData}
                submissionData={latestProposal}
                playerRole={player.get("role")}
                onChangeTotalBonus={setTotalBonus}
              />

              <Calculator
                featureData={featureData}
                handleProposalSubmission={handleSubmitProposal}
                roleName={player.get("name")}
                displaySubmit={calcDisplaySubmit()}
                calculatePoints = {calculatePoints}
                propSelectedFeatures={
                  player.get("selectedFeatures")
                    ? player.get("selectedFeatures")
                    : {}
                }
                handleOptionChange={handleOptionChange}
                playerRole={player.get("role")}
                ref={calculatorRef} 
              />

              {isDevelopment && urlDev && (
                <>

                  <Button handleClick={() => player.stage.set("submit", true)}>
                    Continue
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

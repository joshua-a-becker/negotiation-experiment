import React, { useState } from "react";
import { Button } from "../components/Button";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import Calculator from "../components/Calculator"
import StrawPoll from "../components/StrawPoll"
import Header from "../components/Header"
import { useEffect} from 'react';
import Chat from "../Chat";
import { useChat } from '../ChatContext'; 
import { IntroProfile } from "../IntroProfile";

export function Walkthrough({ next }) {
  
  const game = useGame(); 
  const player = usePlayer();
  const treatment = game.get("treatment");
  const {instructionPage} = treatment;
  const { appendSystemMessage } = useChat();
  const [proposalValue, setProposalValue] = useState()
  const [showInstructionsModal, setShownInstructionsModel] = useState(true);

  //const walkThroughFeatures = featureData["walkthrough_features"];
  //window.features=featureData

  const [walkThroughFeatures, setWalkThroughFeatures] = useState({features:[]});
  const [submissionData, setSubmissionData] = useState(player.get("submissionData")); 
  const [voteButtonActive, setVoteButtonActive] = useState(true); 
  const [showNextButton, setShowNextButton] = useState(false); 

  const role1 = walkThroughFeatures.roleNames===undefined ? "undefined" : walkThroughFeatures.roleNames.role1;

  window.wtf = walkThroughFeatures

  //const [playerMessage, setPlayerMessage] = useState("")

  const setPlayerMessage = (message) => {
    player.set("walkthroughMessage", message)
  }

  useEffect(() => {
    fetch(treatment.featureUrl)
      .then(response => response.json()) 
      .then(data => { setWalkThroughFeatures(data["walkthrough_features"]) })
      .catch(error => console.error("Failed to load features:", error)); // 处理可能的错误
  }, []); 
  


  const handleProposalSubmission = (submission_data) => {
    setSubmissionData(submission_data)
    player.set("submissionData", submission_data)
    setPlayerMessage("proposed")
    sendSystemMessage("Good!  Now, even though this is your own proposal, you still need to vote.")

    setTimeout(
      (sendSystemMessage, myMessage)=>{sendSystemMessage(myMessage)}
      ,3000
      ,sendSystemMessage
      ,"Go ahead and vote on your proposal."
    )
    setVoteButtonActive(false)

  }

  const handleCalcOptionChange = (selectedFeatures) => {
    player.set("selectedFeatures", selectedFeatures)
    
  }

  const handleVoteSubmit = (vote) => {
    sendSystemMessage("Good job!  You'll see the same thing when someone else offers a proposal.")
    setTimeout(
      (sendSystemMessage, myMessage)=>{sendSystemMessage(myMessage)}
      ,2000
      ,sendSystemMessage
      ,"All done!  Click 'next' to continue to the game."
    )
    setShowNextButton(true);
    player.set("currentVote", vote)
    setPlayerMessage(
      <>Waiting for other votes.</>
    )
    return(0);
  }

  const sendSystemMessage = (thisMessage) => {
    appendSystemMessage({
      id: 0,
      text: thisMessage,
      sender: {
        id: "system",
        name: "System",
        avatar: "",
        role: "System",
      }
    });

  }
  
        
  const onLoad = () => {
    if(!player.get("walkThroughStatus")) {
      sendSystemMessage("Welcome to the game!  This demo will walk you through the basic setup.")

      setTimeout(
        (sendSystemMessage, myMessage)=>{sendSystemMessage(myMessage)}
        ,5000
        ,sendSystemMessage
        ,"On your screen you see a calculator.  You can use the calculator to determine the bonus you'd get for various designs"
      )
       
      
      setTimeout(
        (sendSystemMessage, myMessage)=>{sendSystemMessage(myMessage)}
        ,10000
        ,sendSystemMessage
        ,"You can also use the calculator to send a vote to others for consideration. "
      )

      setTimeout(
        (sendSystemMessage, myMessage)=>{sendSystemMessage(myMessage)}
        ,11000
        ,sendSystemMessage
        ,"To do this, pick a proposal and then click 'submit for informal vote'."
      )

      player.set("walkThroughStatus", 1)
    }
  }

  const repeatWalkthrough = function() {

    console.log("go")
    //setPlayerMessage("")
    player.set("selectedFeatures", undefined)
    player.set("submissionData", undefined)
    player.set("chat",[])
    player.set("currentVote", undefined)
    console.log(player.get("currentVote"))
    if(player.get("currentVote")){
      console.log("ok")
    }
    setVoteButtonActive(false)
    setShowNextButton(false)
    setSubmissionData(undefined)
    
  }

  const handleInstructionsModal = function() {
    setShownInstructionsModel(!showInstructionsModal)   
  }

  const calcWalkthroughMessage = (message) => {
    if(message == "proposed") {
      return(
        (<>
          {role1} has made a proposal!  See details below.
          <br /><br />Value to you: {proposalValue}
          <br /><br />Please cast an informal vote.
          <br /><br />
  
  
          <div className="voting-buttons-container">
            <Button className="vote-button" handleClick={() => handleVoteSubmit(1)}>Accept</Button>
  
            <Button className="vote-button" handleClick={() => handleVoteSubmit(0)}>Reject</Button>
          </div>
        </>)
      )
    }
  };

  onLoad();



  
  // if they're done the walkthrough
  
  const completedWalkthroughModal = 
      <>
        <div
          className="task-brief-modal"
          style={{
            position: "fixed",
            margin: 0,
            top: 1,//"20%",
            right: 1,
            left: 1,
            bottom: 1,//"5%",
            padding: 0,//"10px",
            //borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            zIndex: 100,
            backgroundColor: "rgb(20, 20, 20,0.80)",
          }}
        >
        <div
        className="task-brief-modal"
        style={{
          position: "fixed",
          top: "30%",
          right: "30%",
          left: "30%",
          bottom: "30%",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          zIndex: 100,
          backgroundColor: "#FFFFFF",
        }}
  >
        <div className="h-full w-full flex items-center justify-center">
        <div className=" items-center justify-center">

        If this were a real game, you'd be waiting for other players to vote.<br/><br/>
        If it passes informally, you'll get a chance to make it official.<br/><br/>
        <strong>Remember: these informal votes don't count - you must make it official!</strong>
          <br/><br/>
          <center>
          <button onClick={next} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <strong>Next (Continue to Game)</strong>
          </button>
          <br/><br/>
          <button onClick={repeatWalkthrough} className="bg-gray hover:bg-black text-white font-bold py-2 px-4 rounded">
            <strong>Repeat Walkthrough</strong>
          </button>
          </center>
        </div></div>
        </div></div>
      </>
   
  
  const walkthroughCompleted = !(player.get("currentVote")===undefined || player.get("currentVote") ===null)

  const playerMessage =  calcWalkthroughMessage(player.get("walkthroughMessage"))
  
  const walkThroughInstructions = 
    <>
      <br />
      <h6>This is a <b>DEMONSTRATION PAGE.</b></h6>
      <h6><br />Try submitting an informal proposal below!</h6>
      <h6><br />Once in the game, you can submit as many informal proposals as you want.</h6>
      <h6><br />The calculator shows what proposal is worth.</h6>
      <br />
      <h6>If you don't reach agreement within 10 minutes, the leader (randomly assigned) will submit a final proposal.</h6>
      <h6><br /><strong>You ALL must agree for the final proposal to pass!</strong></h6>
    </>  

  return (
      <div className="h-full w-full flex" style={{ position: 'relative' }}>
        <div className="h-full w-full flex flex-col">
          <div style={{ height: '90%', overflowY: 'auto' }}>

      <IntroProfile featureData={walkThroughFeatures} showNextButton={false} onNext={next} roleName={role1} />
      {walkthroughCompleted ? completedWalkthroughModal : ""}

      <Header message={(playerMessage==""?undefined:playerMessage)} player={player} role1={role1} textRef={null} 
      instructions={walkThroughInstructions}/>
            <br />
            <br />

        <div className="table-container" >


 
        <StrawPoll 
          featureData = {walkThroughFeatures}
          submissionData = {submissionData}
          handleVoteSubmission = {handleVoteSubmit}
          message = {playerMessage}
          CurrentVote = {(player.get("currentVote")===null || player.get("currentVote")===undefined) ? undefined : player.get("currentVote")}
          playerRole = "role1"
          onTest = {setProposalValue}
        
        />
      
        <Calculator 
          featureData = {walkThroughFeatures}
          handleProposalSubmission={handleProposalSubmission}
          showVoteButton={true}
          roleName = {role1}
          playerRole = "role1"
          displaySubmit = {!player.get("submissionData")}
          propSelectedFeatures = {player.get("selectedFeatures") ? player.get("selectedFeatures") : {} }
          handleOptionChange = {handleCalcOptionChange}
        />
     
          </div>
        </div>
      </div>
      <div className="h-full w-256 border-l flex justify-center items-center">
        <Chat scope={player} attribute="mychat" />
      </div>
    </div>
  );
}

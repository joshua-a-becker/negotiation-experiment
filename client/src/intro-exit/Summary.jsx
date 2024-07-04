import React from "react";
import { useGame, usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import  { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useChat } from '../ChatContext'; 

export function Summary({next}) {

    const player = usePlayer();
    const game = useGame();
    const round = useRound();
    const players = usePlayers();

    window.player = player;
    window.playerExit=player.get("exitStatus");
    window.playerExit=player.get("playerId");
  
    const treatment = game.get("treatment");
  
    const {basicpay} = treatment;

    const roleIdentifier = player.get("role");
    const roundPoints = player.get("roundPoints") || 0;
    const cumulativePoints = player.get("cumulativePoints") || 0;
    const roundPointsHistory = game.get("RoundPointsHistory")||[] ;
    const totalRounds = roundPointsHistory ? roundPointsHistory.length / 3 : 0;
   const currentPlayerRoundPoints = roundPointsHistory.filter(({ role }) => role === roleIdentifier);
    const roundScores = currentPlayerRoundPoints.map(({ totalPoints }) => totalPoints).join(" + ");

    const proposalHistory = game.get("proposalHistory") || []; 
    const lastProposal = proposalHistory[proposalHistory.length - 1]; // last one
    const lastProposalMessage = lastProposal ? `Good job on your last proposal: ${lastProposal}` : "";

    console.log(game.get("proposalHistory"))    

    console.log('last',lastProposal)
  


    useEffect(() => {

        const roundPointsHistory = game.get("RoundPointsHistory");
        
        const missingProposal = game.get("missingProposal")

        if (roundPointsHistory) {

          const totalRounds = roundPointsHistory.length;
          let cumulativePoints = 0;
          const roundScores = roundPointsHistory.map(({ totalPoints }) => {
            cumulativePoints += totalPoints;
            return totalPoints;
          }).join(" + ");
    
  
          console.log(`In total you have earned £ ${roundScores} across ${totalRounds} rounds, for a total of ${cumulativePoints}.`);
          
          console.log(game.get("missingProposal"))    
          window.game = game;
        }
      }, [game]);

      

  
    const handleContinue = () => {
      player.stage.set("submit", true);
    };

    const returnText = roundScores>=0 ?
      <>You earned a bonus of £{Math.round(roundScores*100)/100} and a base payment of £{basicpay} for a total payment of £{Math.round((parseFloat(basicpay) + parseFloat(roundScores))*100)/100}.</>
      : <>Your bonus was negative, and so was set to zero.<br/><br/>  You earned a base payment of £{basicpay}</>
    
  
    return (
      <>{game&&(<div className="waiting-section">
        <h4>
 
          <br />
          {/* <p>In total you have earned £{roundScores} across {totalRounds} rounds, for a total bonus of ${cumulativePoints}  with basic payment £{basicpay}.</p> */}
          { game.get("missingProposal") ? <>No proposal was submitted in time.<br/><br/></> : <></>}
          { game.get("pass")  ? "" : <>The proposal did not pass.<br/><br/></> }
       
          { game.get("pagoendTriggeredss")  ? "" : <>阿斯顿发啊都是非法所得<br/><br/></> }

          {returnText}
          <br/><br/><strong>Please enter the code "completed" to indicate that you have completed the task.</strong>
          <br />
          <br/><p>Please press "OK" to acknowledge and continue.</p>
        </h4>
        <br />
        <Button handleClick={next} autoFocus >
        <p>OK</p>
        </Button>  
        {/* <Button handleClick={handleContinue}>OK</Button> */}
      </div>)}</>
    );
  }
  
  export default Summary;
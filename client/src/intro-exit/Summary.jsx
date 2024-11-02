import React from "react";
import { useStage, useGame, usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useChat } from '../ChatContext';

export function Summary({ next }) {
  

  const player = usePlayer();
  const game = useGame();
  const stage = useStage();
  const round = useRound();
  const players = usePlayers();
  const treatment = game.get("treatment");
  const { basicpay } = treatment;
  
  const proposalHistory = game.get("proposalHistory");
 
  let returnText="Waiting for other players.."

  window.game=game;
  window.round=round;
  window.stagename=stage.get("name")
  window.treatment=treatment

  if(stage.get("name") == "Round Summary" && (round.get("index")+1)==treatment.numRounds) {
    return("Exit Summary")

  }

  const votingBlock = 
    <>
      <div className="container">
        <div className="waiting-section">
          <div className="loader"></div>
          <div>Other parties are still voting. Once votes are in and tallied, the results will be shown.</div>
        </div>
      </div>
    </>

  if(stage.get("name")=="Submit Formal Vote" || stage.get("name")=="Formal Vote") {
    returnText = votingBlock
  } 

  return (
    returnText
  );
}

export default Summary;
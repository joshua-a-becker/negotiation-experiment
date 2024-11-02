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
 
  let returnText=""

  if(stage.get("name")=="Submit Formal Vote") {
    returnText = "Please wait while others vote..."
  } 
  
  return (
    returnText
  );
}

export default Summary;
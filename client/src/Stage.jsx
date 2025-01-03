//Stage.jsx
import {
  usePlayer,
  usePlayers,
  useRound,
  useStage,
  useGame,
} from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";
import React from "react";
import { Choice } from "./stages/Choice";
import { FormalProposal } from "./stages/FormalProposal";
import { FormalVote } from "./stages/FormalVote";
import { Result } from "./stages/Result";
import { useEffect } from 'react';
import "./stages/css/TableStyles.css";
import Summary from "./intro-exit/Summary";


export function Stage() {

  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const stage = useStage();
  const game = useGame();

  const currentPhase = stage.get("name");

  if (game.get("featureData") === undefined) return <Loading />;

  if (player.stage.get("submit") & stage.get("name")==="Round Summary") { return("Please wait for other players..") }

  switch (stage.get("name")) {
    
    case "Discussion and Informal Vote":
      return <Choice />;

    case "Formal Proposal":
      return <FormalProposal />

    case "Formal Vote":
      return <FormalVote />;

    case "Round Summary":
      return <Result />;

    default:
      return <Loading />;
  }
}
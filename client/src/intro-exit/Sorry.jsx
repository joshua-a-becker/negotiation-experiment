import React from "react";
import { useGame, usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import  { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useChat } from '../ChatContext'; 

export function Sorry({next}) {

    const player = usePlayer();
    const game = useGame();

  
    return (
      <div class="sorry-modal">
        <div class="sorry-modal-content">
         Sorry, we were unable to match you to other players.
         <br/><br/>We will pay you £0.50 for your waiting time.
         <br/><br/><strong>Please enter the completion code "failed".</strong>
        </div>
      </div>          
    );
  }
  
  export default Sorry;
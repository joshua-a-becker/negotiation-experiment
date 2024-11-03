import React from "react";
import {
  useGame,
  usePlayer,
  usePlayers,
  useRound,
} from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function Result() {
  
  const round = useRound();

  const game = useGame();
  const player = usePlayer(); 
  const treatment = game.get("treatment");

 
  // no vote was completed in time
  
  const resultsMessage = player.round.get("roundSummary")


  const clickOk = () => {
    player.stage.set("submit",true)
  }
  
  return (
    <>
      <div className="waiting-section">
        <h4>        
          <br />
          <div dangerouslySetInnerHTML={{__html: resultsMessage}} />
          <br/><p>Please press "OK" to continue.</p>
        </h4>
        <br />
        <Button handleClick={clickOk} autoFocus >
          <p>OK</p>
        </Button>  
      </div>
    </>
  );
}

export default Result;
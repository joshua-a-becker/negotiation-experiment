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

  const playerCount = treatment.playerCount;
  

  const ph = round.get("proposalHistory") 
  const latestProposal = ph[Object.keys(ph)[Object.keys(ph).length - 1]]

  // no vote was completed in time
  const resultsMessage = 
    (()=>{
  
      if(latestProposal.formalVote.length < playerCount) {
        return("Sorry, no vote was completed in time.  You earned no additional bonus.")
      }

      const formalVoteCount = latestProposal.formalVote
        .flatMap(obj => Object.values(obj))
        .reduce((sum, val) => sum + Number(val), 0);


      if(formalVoteCount<playerCount) {
        return("Sorry, the vote has failed.  You earned no additional bonus.")
      } else if(formalVoteCount==playerCount) {
        return("Congratulations!  You have reached agreement!")
      }
        
    })()
  


  const clickOk = () => {
    player.stage.set("submit",true)
  }
  
  return (
    <>
      <div className="waiting-section">
        <h4>        
          <br />
            {resultsMessage}
          <br />
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
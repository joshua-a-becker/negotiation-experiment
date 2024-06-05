import React, { useState } from "react";
import { Button } from "../components/Button";
import { Profile } from "../Profile";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

export function Introduction({ next }) {


  const [boxCount, setBoxCount] = useState(0);

  const game = useGame(); 
  //const player = usePlayer();
  const treatment = game.get("treatment");

  const instructions =  [
      'In this game, you will be paired with '+(treatment.playerCount-1)+' other players to reach agreement on a project design. '
    , 'You will all have a list of features to include or exclude. You task is reach agreement with the other players on which features to include.'
    , 'Some features earn you money, others lose you money.  You each will be assigned different roles that determine your bonus.'
    , 'We will provide you a platform to help you reach agreement!'
    , 'You will have 10 minutes to chat while sharing unofficial, nonbinding votes.'
    , 'After 10 minutes, the project lead will make a final, official proposal.  '
    , 'You all must agree for the final proposal to pass.  Only the final proposal counts.'
  ]


  return (
    <>
      <div className="intro-container">
       

        <br/><br/>

        {((boxCount)>=(instructions.length))&&(
          <><br/><br/>
          <Button handleClick={next} autoFocus >
            <p>Next</p>
          </Button><br/><br/></>
        )}
        {instructions.slice(0, boxCount+1).reverse().map((element, index) => (
          <>
          <div className="introduction-box">
           {element}
          {(index==0 && boxCount<instructions.length)&&(
            <><br/><br/>
              <center><Button handleClick={()=>{setBoxCount(boxCount+1)}} autoFocus >
                <p>Ok</p>
              </Button></center>
            </>
          )}
  </div>
  </>
        ))}
       
      </div>
    </>
  );
}

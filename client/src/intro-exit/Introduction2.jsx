import { isDevelopment } from "@empirica/core/player"
import React, { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { Profile } from "../Profile";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

export function Introduction2({ next }) {


  const [boxCount, setBoxCount] = useState(0);
  const [loadedStartTime, setLoadedStartTime] = useState(true);
  const game = useGame(); 
  //const player = usePlayer();
  const treatment = game.get("treatment");

  const [role1, setRole1] = useState("the project head")



  const instructions =  [
      'You will have 10 minutes to chat while sharing unofficial, nonbinding votes.'
    , 'If one of these passes, you will have the option to make it official.'
    , 'If you haven\'t reached agreement after 10 minutes, '+ role1 +' will make a final, official proposal.  '
    , 'You all must agree for a proposal to pass.  Only official votes count.'
  ]


  return (
    <>
      <div className="big-container"> 
        <div className="scroller">
          <div className="scroller-content">
            <div className="box-content">
              {instructions.slice(0, boxCount+1).reverse().map((element, index) => (
                <>
                  <div className={'introduction-box item ' + (index===0?' box-active':' box-not-active')}>
                    {element}          
                  </div>
                </>
              ))}    
            </div>
            <div class="next-button-container">
              {((boxCount)<(instructions.length))&&(
                <Button class="next-button" handleClick={()=>{setBoxCount(boxCount+1)}} autoFocus >
                  <p>Ok</p>
                </Button>
              )}
              {((boxCount)>=(instructions.length))&&(
                <Button handleClick={next} autoFocus >
                  <p>Next Page</p>
                </Button>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
}

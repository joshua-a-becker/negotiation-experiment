import React, { useState } from "react";
import {
  useGame,
  usePlayer,
  usePlayers,
  useRound,
  useStageTimer,
} from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function ExitSurvey({ next }) {
  const player = usePlayer();
  const game = useGame();
  const players = usePlayers();
  const treatment = game.get("treatment");
  const { basicpay } = treatment;



  const [feedback, setFeedback] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    player.set("exitSurvey", { feedback });
    next();
  }

  const totalBonus = player.get("bonus").reduce((sum, item) => sum + item.bonus, 0);
    const basePay = treatment.basicpay
    const totalPay = totalBonus + basePay

    const roundBonusHtml = "<u>Round Bonuses</u><br/>" +
      player.get("bonus")
        .map(item => "Product: " + item.round + "<br/>Round Bonus: £" +item.bonus)
        .join("<br/><br/>")

  const resultsDisplay = <>      
        <br/><br/>
        <b>The game is over!  Thank you for participating.</b>
        <br/>You have earned £{totalPay} in total.
        <br/><br/>This includes a base payment of: £{basePay}
        <br/><br/>And the following round bonuses...
        <br/><br/>
        <span dangerouslySetInnerHTML={{__html: roundBonusHtml}} />      
    </>



  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {resultsDisplay}
      <form
        className="mt-12 space-y-8 divide-y divide-gray-200"
        onSubmit={handleSubmit}
      >
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Exit Survey
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You have completed the study!
          </p>
          <p className="mt-1 text-sm text-gray-500">
            <br/><strong>Please enter the code "completed" to indicate that you have completed the task.</strong>
          </p>
          <p className="mt-1 text-sm text-gray-500">
          <br/>First, please provide any feedback you wish to share with us.  This is a new task and we value your comments.
          </p>
          <div className="mt-6">
            <textarea
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-empirica-500 focus:border-empirica-500 sm:text-sm"
              dir="auto"
              id="feedback"
              name="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div> 
      </form>
<br />
<div >
  <Button handleClick={handleSubmit} type="submit" >Submit</Button>
</div>
<br />
        
    </div>
  );
}
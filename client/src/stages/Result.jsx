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

  const treatmentFeatureData = game.get("featureData")[treatment.scenario]

  const calculatePoints = (selectedFeatures) => {
    const featuresToCalc = treatmentFeatureData.features


    const pointsReturn = featuresToCalc.reduce((total, feature) => {
        const isSelected = selectedFeatures[feature.name];
        const roleBonus = feature.bonus[player.get("role")] || 0;
        return (total + (isSelected ? roleBonus : 0));
    }, 0);

    return pointsReturn
  }

  const potential_bonus = calculatePoints


  // no vote was completed in time
  
  const resultsMessage = player.round.get("roundSummary")

  window.player=player

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
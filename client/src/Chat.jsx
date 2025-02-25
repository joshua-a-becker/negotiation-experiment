
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { usePlayer, useGame, useRound } from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";

export function Chat({
  scope,
  attribute = "messages",
  loading: LoadingComp = Loading,
}) {

  const player = usePlayer();
  const roundStartTime = scope.get("roundStartTime")
  const startTimeRef = useRef(Date.now());
  const playerMessages = scope.getAttribute(attribute)?.items || [];

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      <Messages msgs={playerMessages} playerRole={player.get("name")} gameStartTime={roundStartTime} /> 
    </div>
  );
}

function Messages({ props, msgs, playerRole, gameStartTime }) {
  const scroller = useRef(null);
  const [atBottom, setAtBottom] = useState(true);
  const [msgCount, setMsgCount] = useState(0);

  const handleScroll = () => {
    if (!scroller.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scroller.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 容忍度为10px
    setAtBottom(isAtBottom);
  };

  useEffect(() => {
    const element = scroller.current;
    element?.addEventListener('scroll', handleScroll);
    return () => element?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (atBottom && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [msgs.length, atBottom]);
  if (msgs.length === 0) {
  }


  useEffect(() => {
    if (!scroller.current) {
      return;
    }
    if (msgCount !== msgs.length) {
      setMsgCount(msgs.length);
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [scroller, props, msgCount]);

  return (
    <div className="h-full overflow-auto pl-2 pr-4 pb-2 shawn"
      ref={scroller}>
      {msgs.map((msg) => (
        <MessageComp key={msg.id} attribute={msg} playerRole={playerRole} gameStartTime={gameStartTime} />
      ))}
    </div>
  );
}

function MessageComp({ attribute, gameStartTime }) {

  const game = useGame();
  const treatment = game.get("treatment");
  const player = usePlayer();
  const messageTime = new Date(attribute.createdAt);
  const elapsedTime = Math.floor((messageTime.getTime() - gameStartTime) / 1000);
  const relativeTime = humanTimer(elapsedTime);


  const roleColors = {
    role1: "#8B4500",
    role2: "#00008B",
    role3: "#006400",
  };
  const msg = attribute.value;
  const isSystemMessage = msg.sender && msg.sender.role === "Notification";
  const ts = attribute.createdAt;
  const textColor = isSystemMessage ? "#FF4500" : roleColors[msg.sender.role] || "#000000";

  // helper function to calculate points
  const calculatePoints = (selectedFeatures) => {
    
    const featureData =
      game.get("featureData") === undefined
        ? undefined
        : game.get("featureData")[treatment.scenario];
        

    const featuresToCalc = featureData.features
    const roleToCalc = player.get("role")

    const pointsReturn = featuresToCalc.reduce((total, feature) => {
        const isSelected = selectedFeatures[feature.name];
        const roleBonus = feature.bonus[roleToCalc] || 0;
        return (total + (isSelected ? roleBonus : 0));
    }, 0);

    return ( Number(pointsReturn.toFixed(2)) );
  };

  if(msg.sender.role=="PROPOSAL" && msg.id) {
    
    const round = useRound();
    const proposalHistory = round.get("proposalHistory")
    const this_proposal = proposalHistory[msg.id-1]
    
    if(this_proposal === undefined) { return ("Processing...")}

    
    const votesInformal = this_proposal.informalVote
    const totalYesInformal = votesInformal
        .map(vote => Object.values(vote)[0])
        .reduce((sum, vote) => sum + vote, 0);
    const totalNoInformal = votesInformal.length - totalYesInformal;
    
    const votesFormal = this_proposal.formalVote
    const totalYesFormal = votesFormal
        .map(vote => Object.values(vote)[0])
        .reduce((sum, vote) => sum + vote, 0);
    const totalNoFormal = votesFormal.length - totalYesFormal;
  

    
    window.features = this_proposal.decisions
    window.calc = calculatePoints(this_proposal.decisions)

    const valueLine =
      <p style={{ color: textColor }}><i>Value to you:</i> £{calculatePoints(this_proposal.decisions)}</p>

    return(
      <div className="flex items-start my-2" >

        <div className="ml-3 text-sm" >
          <p>
            <span className="font-semibold" style={{ color: textColor }}>
              {this_proposal.submitterRole} has submitted a proposal!
            </span>
            <span className="pl-2 text-gray-400">{(relativeTime !== "NaN:NaN") ? relativeTime : ""}</span>
          </p>
          <p style={{ color: textColor }}><i>Features included:</i> {Object.keys(this_proposal.decisions).join(", ")}</p>
          {String(treatment.showValue).toLowerCase()==="yes" ? valueLine : ""}
          <p style={{ color: textColor }}><i>Informal votes:</i> Yes:  {totalYesInformal}, No: {totalNoInformal}</p>
          {(votesFormal.length>0 ? <p style={{ color: textColor }}><i>Official votes:</i> Yes:  {totalYesFormal}, No: {totalNoFormal}</p> : "")}
          
        </div>
      </div>
    )
  }


  return (

    <div className="flex items-start my-2" >
      <div className="ml-3 text-sm" >
        <p>
          <span className="font-semibold" style={{ color: textColor }}>
            {msg.sender.name}
          </span>
          <span className="pl-2 text-gray-400">{(relativeTime !== "NaN:NaN") ? relativeTime : ""}</span>
        </p>
        <p style={{ color: textColor }}>{msg.text}</p>
        
      </div>
    </div>
  );
}

function humanTimer(seconds) {
  if (seconds === null || seconds === undefined) {
    return "--:--";
  }

  let out = "";
  const s = seconds % 60;
  out += s < 10 ? "0" + s : s;

  const min = Math.floor(seconds / 60) % 60;
  out = `${min < 10 ? "0" + min : min}:${out}`;

  const h = Math.floor(seconds / 3600);
  if (h > 0) {
    return `${h < 10 ? "0" + h : h}:${out}`;
  }

  return out;
}


export default Chat;
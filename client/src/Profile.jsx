import {
  usePlayer,
  useRound,
  useStage,
  useGame,
  usePlayers,
} from "@empirica/core/player/classic/react";
import React, { useState } from "react";
import { Avatar } from "./components/Avatar";
import { Timer } from "./components/Timer";
import featureData from "./featureData"

export function Profile() {
  const game = useGame();
  const treatment = game.get("treatment");
  const { instructionPage } = treatment;
  const instructionsHtml = { __html: instructionPage }
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();

  const playerModalSeen = player.get("playerModalSeen") || false // return true if set to true, false if undefined or false
  console.log("default = " + playerModalSeen)

  const [showTaskBrief, setShowTaskBrief] = useState(!playerModalSeen);


  // 函数用于打开和关闭模态框
  const handleShowTaskBrief = () => setShowTaskBrief(true);
  const handleCloseTaskBrief = () => {
    player.set("playerModalSeen", true)
    setShowTaskBrief(false);
  }
  const featureData = game.get("featureData") === undefined ? undefined : game.get("featureData")[treatment.scenario]

  function interpolateString(template, variables) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return typeof variables[key] !== 'undefined' ? variables[key] : match;
    });
  }

  // 内嵌的 TaskBriefModal 组件
  function TaskBriefModal({ onClose }) {
    //const task_brief = "hello"//featureData.task_brief === undefined ? undefined : featureData.task_brief.toString();

    const product_name = featureData === undefined ? undefined : featureData.product_name
    const task_brief = featureData === undefined ? undefined : featureData.task_brief
    const parse_vars = {
      roleName: player.get("name"),
      productName: product_name
    };
    const task_brief_parsed = task_brief === undefined ? undefined : interpolateString(task_brief, parse_vars);

    function onContainerClick(event) {
      event.preventDefault()
      const thisTarget = event.target
      if(thisTarget.id == "container") {
        onClose();
      }
    }

    return (
      <div
        id = "container"
        className="task-brief-modal"
        style={{
          position: "fixed",
          margin: 0,
          top: 1,//"20%",
          right: 1,
          left: 1,
          bottom: 1,//"5%",
          padding: 0,//"10px",
          //borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          zIndex: 100,
          backgroundColor: "rgb(220, 243, 247,0.70)",
        }}
        onClick={onContainerClick}
      >
        <div
          className="task-brief-modal"
          style={{
            overflow: 'auto',
            position: "fixed",
            top: "20%",
            right: "20%",
            left: "20%",
            bottom: "20%",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            zIndex: 100,
            backgroundColor: "#FFFFFF",
            cursor: "auto"
          }}
          onClick = {null}
        >
          <div className="task-brief text-black">
            <h2 className="task-brief-title">
              <strong cstyle={{ fontSize: "larger", textDecoration: "underline" }}>Task Brief</strong>
            </h2>
            <br />
            <div className="task-brief-text" dangerouslySetInnerHTML={{ __html: task_brief_parsed }} />
            
            
            <center>
            <div className='task-brief-text'
            style={{
              cursor: "pointer", // 鼠标悬停时的指针形状
              background: "#a31f15", // 深灰色背景
              color: "white", // 白色文字
              width: 'fit-content',              
              paddingLeft: '10px',
              paddingRight: '10px',
              borderRadius: '5px'
            }}
            onClick={onClose}
          >
            <b>CLOSE</b>
          </div>

            </center>
          </div>

          {/* 关闭按钮，使用绝对定位 */}
          <div
            style={{
              position: "absolute", // 绝对定位
              top: "10px", // 距离模态框顶部10px
              right: "10px", // 距离模态框右侧10px
              background: "#333", // 深灰色背景
              color: "white", // 白色文字
              borderRadius: "50%", // 圆形
              width: "30px", // 宽度
              height: "30px", // 高度
              display: "flex", // 使用Flex布局使内容居中
              alignItems: "center", // 垂直居中
              justifyContent: "center", // 水平居中
              cursor: "pointer", // 鼠标悬停时的指针形状
            }}
            onClick={onClose}
          >
            <b>X</b>
          </div>
        </div></div>
    );
  }


  return (
    <div className="min-w-lg md:min-w-2xl mt-2 m-x-auto px-3 py-2 text-gray-500 rounded-md grid grid-cols-3 items-center border-.5">
      <div className="leading-tight ml-1">
        <div className="text-gray-600 font-semibold">
          {stage ? stage.get("name") : ""}
        </div>
        <div className="text-empirica-500 font-medium">
        </div>
      </div>
      <Timer />
      <div className="flex space-x-3 items-center justify-end">
        <button
          onClick={handleShowTaskBrief}
          className={showTaskBrief ? "bg-red-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            : "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}>
          Show Task Brief
        </button>
        {showTaskBrief && <TaskBriefModal onClose={handleCloseTaskBrief} />}
      </div>
    </div>
  );
}




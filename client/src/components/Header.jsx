
import React from "react";
import { useState, useEffect, useContext, useRef } from 'react';
import { Button } from "./Button";
import { ScrollContext } from "./ScrollContext";

function Header(props) {

    const player = props.player
    const role1 = props.role1
    const message = props.message
    const textRef = null
    const instructionsText = ((instructions) => {
        if(instructions===undefined) {
            return(
                    <>
                        <br />
                        <h6>Submit as many informal proposals as you want below.</h6>
                        <h6><br />The calculator shows what proposal is worth.</h6>
                        <br />
                        <h6>{'role1' === player.get("role") ? "As " + role1 + ", you" : "At the end, " + role1} will submit a final proposal {'role1' === player.get("role") ? "at the end." : ""}</h6>
                        <h6><br /><strong>You ALL must agree for the final proposal to pass!</strong></h6>
                    </>            
                )
            }

            if(typeof instructions === 'object'){
                return(instructions)
            }

            return(
                <><br/><div dangerouslySetInnerHTML={{__html:instructions}}></div></>
            )
        })(props.instructions)

    window.it = props.instructions;

    const [showInstructionsModal, setShownInstructionsModel] = useState(false);

    const handleInstructionsModal = function () {
        setShownInstructionsModel(!showInstructionsModal)
    }

    const messageContent = message===undefined ? "" :
        <div className="header-text" style={{ position: "relative", marginTop: '20px' }}>
            <div style={{
                marginTop: '10px',
                padding: '20px',
                background: '#f9f9f9',
                border: '1px solid #ddd',
            }}>
                {message}
            </div>
        </div>

    return(

    <>
        <div className="informal-text-brief-wrapper" style={{ position: "relative" }}>
            <div className="informal-text-brief-1" style={{ position: "relative", marginTop: '20px' }}>
                <div
                className="modal-closer"
                onClick={handleInstructionsModal}
                >
                {showInstructionsModal ? <b>X</b> : "▼"}
                </div>
                <h6><strong><a style={{cursor: "pointer"}} onClick={handleInstructionsModal}>INSTRUCTIONS (click to expand)</a></strong></h6>
                {showInstructionsModal && (instructionsText)}
            </div>
            {messageContent}
        </div>
    </>
    )
}

export default Header;
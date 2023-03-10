import React, { createRef, useContext, useEffect, useState } from "react";
import { HotKeys } from "react-hotkeys";

import Konva from "konva";
import { MyLine } from "./MyLine";
import { Stage, Layer, Group, Line, Rect } from "react-konva";

import { ToolBar } from "./ToolBar";
import { Keyword } from "./Keyword"
import { Concept } from "./Concept";
import { Section } from "./Section";
import { TaskNode } from "./TaskNode";
import { StickyNote } from "./StickyNote";

import { TaskBoard } from "./TaskBoard";

import { Prompter } from "./Prompter";
import { TaskPrompt } from "./TaskPrompt";
import { PromptPanel } from "./PromptPanel";
import { PromptGPT } from "./utils/GPT_utils";

import { colorPalette } from "./utils/color_utils";
import { anchor_utils, node_utils } from "./utils/canvas_utils";
import { GlobalContext, CanvasContext, PrompterContext } from "./state";



export function Canvas({dimensions})
{
    const {nodes, numNodes, arrows, sections,
        setNodes, setNumNodes, setArrows, setSections,
        promptCards, mainPrompter, taskPrompts, microTasks,
        setPromptCards, setMainPrompter, setTaskPrompts, setMicroTasks,
        taskNodes, setTaskNodes} = useContext(GlobalContext);

    const [canvasX, setCanvasX] = React.useState(0);
    const [canvasY, setCanvasY] = React.useState(0);
    const [canvasScale, setCanvasScale] = React.useState(1);
    const stageRef = React.useRef(null);
    const layerRef = React.useRef(null);

    const [selectionRect, setSeletionRect] = React.useState({
        visible: false,
        x1: 0, y1: 0,
        x2: 0, y2: 0
    });
    const selectionRectRef = React.useRef(null);

    const promptCardsRef = React.useRef([]);
    if (promptCardsRef.current.length !== promptCards.length+1) {
        promptCardsRef.current = Array(promptCards.length+1).fill()
        .map((_,i)=>promptCardsRef.current[i] || createRef());
    }

    const [isDrawingArrow, setIsDrawingArrow] = React.useState(false);
    const [isDrawingDoubleArrow, setIsDrawingDoubleArrow] = React.useState(false);
    const [isSectioning, setIsSectioning] = React.useState(false);
    const [isAddingKeyword, setIsAddingKeyword] = React.useState(false);
    const [arrowFrom, setArrowFrom] = React.useState({id: -1, anchor: -1});
    const [arrowTo, setArrowTo] = React.useState({id: -1, anchor: -1});
    const [isMultiSelecting, setIsMultiSelecting] = React.useState(false);

    const [isTaskHeaderVisible, setIsTaskHeaderVisible] = React.useState(true);
    const [isHoverToolBar, setIsHoverToolBar] = React.useState(false);
    const [toolBarVisibility, setToolBarVisibility] = React.useState(true);

    const [promptPanelPosition, setPromptPanelPosition] = React.useState({});
    const [promptPanelVisibility, setPromptPanelVisibility] = React.useState(false);

    const [inFocus, setInFocus] = React.useState({});
    // const followerProcess = React.useRef(null);
    // const [followerPositionQueue, setFollowerPositionQueue] = React.useState([]);
    // const [isFollowerModeEnabled, setIsFollowerModeEnabled] = React.useState(false);

    // const [pointerTracker, setPointerTracker] = React.useState(-1);
    // const [fittsLawTracker, setFittsLawTracker] = React.useState(-1);
    const [pointerPosition, setPointerPosition] = React.useState({x:-1, y:-1});

    const pointer2CanvasPosition = (position) => {
        const posX = (position.x - canvasX) / canvasScale;
        const posY = (position.y -  canvasY) / canvasScale;
        return [posX, posY];
    }

    const canvas2PointerPosition = (position) => {
        const posX = position.x * canvasScale + canvasX;
        const posY = position.y * canvasScale + canvasY;
        return [posX, posY];
    }

    useEffect(()=>{
        setTaskNodes(prevState=>prevState.filter(state=>
            state.node_id!==inFocus.node&&state.task_id!==0));

        // handleMicroTask(0,"node",0);
    }, [inFocus])

    useEffect(() => {
        // clearInterval(pointerTracker);
        const pointerTracker = setInterval(() => {
            if (stageRef && stageRef.current) {
                const position = stageRef.current.getPointerPosition();
                if (position) {
                    setPointerPosition(position);
                }
            }
        }, 25);
        // setPointerTracker(_pointerTracker);
        // clearInterval(fittsLawTracker)
        const fittsLawTracker = setInterval(()=>{
            const position = pointer2CanvasPosition(stageRef.current.getPointerPosition());
            var ID_inv = nodes.map(node=>1/node_utils.calcFittsLawID(node,position));
            const sumIDInv = ID_inv.reduce((sum,id_inv)=>sum+id_inv,0);
            ID_inv = ID_inv.map(id_inv=>id_inv/sumIDInv);
            
            const split = Math.random();
            var tmpSum = 0.;
            var sample_id = -1;
            for (var i = 0; i < ID_inv.length; i++) {
                tmpSum += ID_inv[i];
                if (tmpSum > split) {
                    sample_id = i;
                    break;
                }
            }

            setInFocus({node: sample_id})
            // setInFocus({node: ID_inv.indexOf(Math.min(...ID_inv))});
            // console.log(ID.indexOf(Math.min(...ID)));
        }, 5000);

        if (!isHoverToolBar && stageRef) {
            stageRef.current.container().style.cursor =
            (isDrawingArrow || isDrawingDoubleArrow) ? "crosshair"
            : isAddingKeyword ? "text" : "default";
        } else {
            stageRef.current.container().style.cursor = "default";
        }

        if (!isDrawingArrow && !isDrawingDoubleArrow) {
            setArrowFrom({id: -1, anchor: -1});
            setArrowTo({id: -1, anchor: -1});
        }

        return () => {
            clearInterval(pointerTracker);
            clearInterval(fittsLawTracker);
        };
    }, [dimensions, canvasScale, isHoverToolBar,
        isDrawingArrow, isDrawingDoubleArrow, isAddingKeyword]);


    const UnselectAllNodes = () => {
        setNodes(prevState => {
            return prevState.map((state)=>{
                let tmp = state;
                tmp.selected = false;
                return tmp;
            });
        });
    }
    const UnselectAll = e => {
        if (e) {
            e.preventDefault();
        }
        UnselectAllNodes();
        setSections(prevState => {
            return prevState.map((state)=>{
                let tmp = state;
                tmp.selected = false;
                return tmp;
            });
        });

        setIsDrawingArrow(false);
        setIsDrawingDoubleArrow(false);
        setIsAddingKeyword(false);
        setPromptPanelVisibility(false);
    };
    const DeleteSelected = e => {
        if (e) {
            e.preventDefault();
        }
        setNodes(prevState => {
            return prevState.map((state)=>{
                let tmp = state;
                tmp.display = (tmp.display & !tmp.selected);
                tmp.selected = false;
                return tmp;
            })
        });
    }

    const handleMicroTask = (task_id, object_type, object_id) => {
        setTimeout(()=>{
            // setTaskNodes(prevState=>{
            //     return [
            //         ...prevState,
            //         {node_id: prevState.lenth,
            //             task_id: 0, attached_to_id: 0, type: "keyword"}
            //     ]
            // })
            if (object_type==="node") {
                setNodes(prevState=>prevState.map(state=>{
                    let tmp = state;
                    if (tmp.id === object_id) {
                        tmp.callbackTaskId = task_id;
                    }
                    return tmp;
                }));
            }
        }, 3000)
    }
    const handleHeaderTaskClick = (task_id, object_type, object_id) => {
        if (object_type === "node") {
            setNodes(prevState => prevState.map(state => {
                let tmp = state;
                if (tmp.id === object_id) {
                    if (tmp.disabledTaskId.has(task_id)) {
                        tmp.disabledTaskId.delete(task_id);
                    } else {
                        tmp.disabledTaskId.add(task_id);
                    }
                }
                return tmp;
            }))
        }
    }

    const [promptCardIndex, setPromptCardIndex] = React.useState(1);

    const updatePromptCards = (prompt) => {
        const lastPromptCardIndex = promptCardIndex === 1 ? 5 : promptCardIndex-1;
        promptCardsRef.current.map((promptCardRef,index)=>{
            if (index !== 0) {
                if (index !== lastPromptCardIndex) {
                    const indexOffset = index >= promptCardIndex ?
                    index-promptCardIndex+1 : 6-(promptCardIndex-index);
                    promptCardRef.current.to({
                        y: promptCardRef.current.y()+175,
                        duration: 0.1+(5-indexOffset)*0.15,
                        easing: Konva.Easings.EaseInOut,
                    })
                }
            }
        });

        promptCardsRef.current[lastPromptCardIndex].current.to({
            y: dimensions.height*0.05,
            opacity: 0.12,
            duration: 0.75,
            easing: Konva.Easings.EaseOut,
            onFinish: ()=>{
                // PromptGPT("Life is short,",
                //     100,
                //     (text)=>{
                //         setPromptCards(prevState=>{
                //             // prevState.splice(0,0,prevState.pop());
                //             return prevState.map((state,index)=>{
                //                 if (index+1 === lastPromptCardIndex) {
                //                     state.text = 'Life is short,'+text;
                //                 }
                //                 // state.y = dimensions.height*0.05 + 175*index;
                //                 return state;
                //             });
                //         });
                //     });
                            
                promptCardsRef.current[lastPromptCardIndex].current.to({
                    opacity: 1,
                    duration: 0.5,
                    easing: Konva.Easings.EaseIn,
                    onFinish: ()=> {
                        // promptCardsRef.current.splice(1, 0, promptCardsRef.current.pop());
                        
                        
                        setPromptCardIndex(lastPromptCardIndex);
                    }
                });
            }
        });
    }

    const keyMap = {
        UNSELECT_ALL: "escape",
        DELETE: "del"
    };
    
    const handlers = {
        UNSELECT_ALL: UnselectAll,
        DELETE: DeleteSelected
    };

    const handleDragNodeMove = (e, id) => {
        setNodes(prevState => {
            return prevState.map((state) => {
                let tmp = state;
                if (tmp.id === id) {
                    tmp.x = e.target.x();
                    tmp.y = e.target.y();
                }
                return tmp;
            });
        });
    }
    const handleDragNodeEnd = (e, id) => {
        setNodes(prevState => {
            return prevState.map((state) => {
                let tmp = state;
                if (tmp.id === id) {
                    tmp.x = e.target.x();
                    tmp.y = e.target.y();
                }
                return tmp;
            });
        });
    }

    const handleStageWheel = e => {
        e.evt.preventDefault();
        var scaleBy = 1.12;
        scaleBy = e.evt.deltaY < 0 ? scaleBy : 1 / scaleBy;
        const newScale = canvasScale * scaleBy
        setCanvasScale(newScale);
        
        const position = e.target.getStage().getPointerPosition();
        const offsetX = (position.x - canvasX) * (scaleBy - 1);
        const offsetY = (position.y - canvasY) * (scaleBy - 1);
        setCanvasX(canvasX - offsetX);
        setCanvasY(canvasY - offsetY);
    }

    const handleStageClick = e => {
        if (isAddingKeyword) {
            const position = pointer2CanvasPosition(pointerPosition);
            setNodes(prevState=>{
                let tmp = {id: numNodes, type: "keyword",
                x: position[0], y: position[1],
                width: 0, height: 0, fontSize: 20,
                scaleX: 1/canvasScale, scaleY: 1/canvasScale,
                selected: true, text: "", display: true,
                disabledTaskId: new Set(),
                callbackTaskId: -1};
                return [...prevState, tmp];
            });
            setNumNodes(numNodes+1);
            setIsAddingKeyword(false);
        } else {
            UnselectAll();
        }
    }

    const handleStageMouseDown = e => {
        // e.cancelBubble = true;
        // if (!isDrawingArrow && !isDrawingDoubleArrow) {
        //     setIsMultiSelecting(true);
        // }
        if (isSectioning) {
            setSeletionRect({
                visible: true,
                x1: pointerPosition.x,
                x2: pointerPosition.x,
                y1: pointerPosition.y,
                y2: pointerPosition.y
            });
            // updateSelectionRect();
        }
    }
    const handleStageMouseMove = e => {
        if (isSectioning) {
            setSeletionRect(rect=>{
                return {
                visible: rect.visible,
                x1: rect.x1,
                y1: rect.y1,
                x2: pointerPosition.x,
                y2: pointerPosition.y
                }
            })
        }
    }
    const handleStageMouseUp = e => {
        if (isSectioning) {
            setSections(prevState=>{
                const position1 = pointer2CanvasPosition({
                    x: selectionRect.x1, y: selectionRect.y1
                })
                const position2 = pointer2CanvasPosition({
                    x: selectionRect.x2, y: selectionRect.y2
                })
                return [
                    ...prevState,
                    {id: prevState.length, selected: false,
                    callbackTaskId: -1, scaleX: 1, scaleY: 1,
                    x: Math.min(position1[0], position2[0]),
                    y: Math.min(position1[1], position2[1]),
                    width: Math.abs(position1[0]-position2[0]),
                    height: Math.abs(position1[1]-position2[1]),
                    text: "section "+(sections.length+1).toString()}
                ];
            });
            setSeletionRect({
                visible: false,
                x1: 0, y1: 0,
                x2: 0, y2: 0
            })
            setIsSectioning(false);
        }
    }

    const promptPanelPopup = () => {
        setPromptPanelVisibility(true);
        setPromptPanelPosition(pointerPosition);
    }

    const setPrompterPosition = (e, id) => {
        setPromptCards(prevState => {
            return prevState.map((state) => {
                if (state.id === id) {
                    let tmp = state;
                    tmp.x = e.target.x();
                    tmp.y = e.target.y();
                    return tmp;
                } else {
                    return state;
                }
            })
        });
    }

    const getNodeById = (id) => {
        return nodes.filter(node=>node.id===id)[0];
    }
    const onNodeSelect = (e,id) => {
        e.cancelBubble = true;
        setNodes(
        prevState => {
            return prevState.map(state => {
                let tmp = state;
                if (tmp.id === id) {
                    tmp.selected = true;
                } else {
                    tmp.selected = false;
                }
                return tmp;
            });
        });
    }
    const onNodeTextChange = (value,id) => {
        setNodes(
            prevState => {
                return prevState.map(state => {
                    let tmp = state;
                    if (tmp.id === id)
                        tmp.text = value;
                    return tmp;
                });
        })
    }
    const onNodeScale = (id, newScale, newX, newY) => {
        setNodes(prevState => {
            return prevState.map(state => {
                let tmp = state;
                if (tmp.id === id) {
                    tmp.scaleX = newScale;
                    tmp.scaleY = newScale;
                    tmp.x = newX;
                    tmp.y = newY;
                }
                return tmp;
            });
        });
    }
    const resetNodeCallbackTaskId = (id) =>{
        setNodes(prevState => prevState.map(state=>{
            let tmp = state;
            if (tmp.id === id) {
                tmp.callbackTaskId = -1;
            }
            return tmp;
        }));
    }

    const onNodeConnected = (e, id, anchor)=>{
        e.cancelBubble = true;
        if (e.evt.button===0 && e.evt.type==="mousedown") {
            setArrowFrom({id: id, anchor: anchor});
        } else if (e.evt.button===0 && e.evt.type==="mouseup") {
            if (id !== arrowFrom.id && arrowFrom.id !== -1) {
                if (isDrawingArrow || isDrawingDoubleArrow) {
                    setArrows(prevState=>{
                        return [...prevState, {
                            from_id: arrowFrom.id,
                            from_anchor: arrowFrom.anchor,
                            to_id: id,
                            to_anchor: anchor,
                            directed: isDrawingArrow
                        }]
                    });
                }
            }

            setIsDrawingArrow(false);
            setIsDrawingDoubleArrow(false);
            setArrowFrom({id: -1, anchor: -1});
            setArrowTo({id: -1, anchor: -1});
            // promptPanelPopup();
        }
    }

    const onMainPrompterHover = node => {
        setToolBarVisibility(false);
        node.to({
            scaleX: 1.2,
            scaleY: 1.2,
            x: mainPrompter.x - mainPrompter.width*0.1,
            y: mainPrompter.y - mainPrompter.height - 40,
            shadowBlur: 0,
            shadowOpacity: 0
        })
    }

    const onMainPrompterUnhover = node => {
        setToolBarVisibility(true);
        node.to({
            scaleX: 1,
            scaleY: 1,
            x: mainPrompter.x,
            y: mainPrompter.y,
            shadowBlur: 5,
            shadowOpacity: 0.25
        })
    }

    const findPathBetweenNodeAndPointer = (anchor, node) => {
        const anchorOffset = anchor_utils.calcAnchorOffsetPositions(node,canvasScale);

        const pointerOnCanvasPosition = pointer2CanvasPosition(pointerPosition);

        const [anchorX,anchorY] = anchorOffset[anchor];
        const dx = (anchor%2)*parseInt(2*(anchor/2-1));
        const dy = ((anchor+1)%2)*parseInt(2*(anchor/2-0.5));
        if ((dx !== 0 && (pointerOnCanvasPosition[0]-anchorX)*dx > 0)
        || ((dx === 0) && (pointerOnCanvasPosition[1]-anchorY)*dy < 0)) {
            return [anchorX, anchorY, pointerOnCanvasPosition[0], anchorY,
                pointerOnCanvasPosition[0], pointerOnCanvasPosition[1]];
        } else {
            return [anchorX, anchorY, anchorX, pointerOnCanvasPosition[1],
                pointerOnCanvasPosition[0], pointerOnCanvasPosition[1]];
        }
    }


    return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
    <Stage
    width={dimensions.width}
    height={dimensions.height}
    style={{ backgroundColor: "#F5F6FC" }}
    onWheel={handleStageWheel}
    onClick={handleStageClick}
    onMouseDown={handleStageMouseDown}
    onMouseMove={handleStageMouseMove}
    onMouseUp={handleStageMouseUp}
    // onDblClick={toggleFollowerMode}
    ref={stageRef}
    >
        {/* <Layer>
            <TaskPrompt
            x={nodes[0].x}
            y={nodes[0].y-50}
            width={180}
            height={21}
            color={"purple"}
            fontSize={12}
            text={"Provide a tldr version of [placeholder]"}/>
        {taskPrompts.map((taskPrompt,index)=>{
                const node = nodes.filter(node=>node.id===taskPrompt.node_id);
                const position = node.length === 0 ? [0,0] :
                canvas2PointerPosition({x: node[0].x, y: node[0].y});
                return <TaskPrompt
                key={index}
                x={position[0]}
                y={position[1]-25}
                width={180}
                height={21}
                color={"#FFB347"}
                fontSize={12}
                text={taskPrompt.prompt}/>
            })}
        </Layer> */}

        <Layer
        x={canvasX}
        y={canvasY}
        scaleX={canvasScale}
        scaleY={canvasScale}
        ref={layerRef}
        opacity={promptPanelVisibility ? 0.5 : 1}
        >
            <Group>
            <CanvasContext.Provider value={{canvasX, canvasY, canvasScale, microTasks}}>
            {sections.map(section=>{
                return (<Section
                key={section.id}
                x={section.x}
                y={section.y}
                isSelected={section.selected}
                scaleX={section.scaleX}
                scaleY={section.scaleY}
                width={section.width}
                height={section.height}
                text={section.text}
                fontSize={18}
                color={"#0099FF"}
                header={isTaskHeaderVisible}
                onScale={(scaleX,scaleY,x,y)=>{
                    setSections(prevState => prevState.map(state => {
                        let tmp = state;
                        if (tmp.id === section.id) {
                            tmp.x = x;
                            tmp.y = y;
                            tmp.scaleX = scaleX;
                            tmp.scaleY = scaleY;
                        }
                        return tmp;
                    }))
                }}
                onTextChange={(text)=>{
                    setSections(prevState => prevState.map(state => {
                        let tmp = state;
                        if (tmp.id === section.id) {
                            tmp.text = text;
                        }
                        return tmp;
                    }))
                }}
                onClick={(e)=>{
                    e.cancelBubble = true;
                    setSections(prevState => prevState.map(state => {
                        let tmp = state;
                        if (tmp.id === section.id) {
                            tmp.selected = true;
                        } else {
                            tmp.selected = false;
                        }
                        return tmp;
                    }));
                }}
                handleDragMove={(e)=>{
                    setSections(prevState=>prevState.map(state=>{
                        let tmp = state;
                        if (tmp.id === section.id) {
                            tmp.x = e.target.x();
                            tmp.y = e.target.y();
                        }
                        return tmp;
                    }))
                }}
                handleDragEnd={(e)=>{
                    setSections(prevState=>prevState.map(state=>{
                        let tmp = state;
                        if (tmp.id === section.id) {
                            tmp.x = e.target.x();
                            tmp.y = e.target.y();
                        }
                        return tmp;
                    }))
                }}
                callbackTaskId={section.callbackTaskId}
                resetNodeCallbackTaskId={()=>resetNodeCallbackTaskId(section.id)}/>)
            })}
            {nodes.map((node, index) => {
                return node.display ?
                node.type==="sticky_note"?
                <StickyNote
                key={node.id}
                id={node.id}
                x={node.x}
                y={node.y}
                scaleX={node.scaleX}
                scaleY={node.scaleY}
                width={node.width}
                height={node.height}
                fontSize={node.fontSize}
                color={"#748B97"}
                isNull={node.text === ""}
                text={node.text}
                draggable={!isDrawingArrow && !isDrawingDoubleArrow}
                isConnecting={isDrawingArrow || isDrawingDoubleArrow}
                onScale={(newScale, newX, newY)=>onNodeScale(node.id, newScale, newX, newY)}
                onResize={(offsetW, offsetH, offsetX, offsetY) => {
                    if (node.height + offsetH >= 14
                        && node.width + offsetW >= 105) {
                            setNodes(prevState => {
                                return prevState.map(state => {
                                    let tmp = state;
                                    if (tmp.id === node.id) {
                                        tmp.width += offsetW;
                                        tmp.height += offsetH;
                                        tmp.x += offsetX;
                                        tmp.y += offsetY;
                                    }
                                    return tmp;
                                });
                            });
                        }
                }}
                onConnectingHover={(e,anchor)=>{
                    if (arrowFrom.id !== -1) {
                        setArrowTo({id: node.id, anchor: anchor});
                    }
                }}
                onConnectingUnhover={(e)=>{
                    setArrowTo({id: -1, anchor: -1});
                }}
                onConnected={(e,anchor)=>onNodeConnected(e,node.id,anchor)}
                onClick={(e)=>onNodeSelect(e,node.id)}
                // onDragStart={(e)=>{e.cancelBubble=true}}
                onDragMove={(e)=>{handleDragNodeMove(e,node.id)}}
                onDragEnd={(e)=>{handleDragNodeEnd(e,node.id)}}
                onTextChange={(value)=>onNodeTextChange(value,node.id)}
                isSelected={node.selected}
                headerListening={!isDrawingArrow &&
                    !isDrawingDoubleArrow&&!isSectioning&&!isAddingKeyword}
                onOverflow={(scrollHeight)=>{
                    setNodes(prevState =>{
                        return prevState.map(state => {
                            let tmp = state;
                            if (tmp.id === node.id)
                                tmp.height = scrollHeight;
                            return tmp;
                        });
                    })
                }}
                disabledSet={node.disabledTaskId}
                onHeaderTaskClick={(task_id)=>handleHeaderTaskClick(task_id,"node",node.id)}
                callbackTaskId={node.callbackTaskId}
                resetNodeCallbackTaskId={()=>resetNodeCallbackTaskId(node.id)}
                header={isTaskHeaderVisible}/> :
                node.type === "keyword" ?
                <Keyword
                key={node.id}
                x={node.x}
                y={node.y}
                scaleX={node.scaleX}
                scaleY={node.scaleY}
                fontSize={node.fontSize}
                color={"#CED8DF"}
                text={node.text}
                padding={10}
                isNull={node.text===""}
                isSelected={node.selected}
                isConnecting={isDrawingArrow || isDrawingDoubleArrow}
                onClick={(e)=>onNodeSelect(e,node.id)}
                onDragMove={(e)=>{handleDragNodeMove(e,node.id)}}
                onDragEnd={(e)=>{handleDragNodeEnd(e,node.id)}}
                onTextChange={(value)=>onNodeTextChange(value,node.id)}
                onTextSizeChange={(rect)=>{
                    if (rect.width && rect.height &&
                    (node.width !== rect.width || node.height !== rect.height)) {
                        setNodes(prevState=>{
                            return prevState.map(state=>{
                                let tmp = state;
                                if (tmp.id === node.id) {
                                    tmp.width = rect.width;
                                    tmp.height = rect.height;
                                }
                                return tmp;
                            });
                        })
                    }
                }}
                onScale={(newScale, newX, newY)=>onNodeScale(node.id, newScale, newX, newY)}
                onConnectingHover={(e,anchor)=>{
                    if (arrowFrom.id !== -1) {
                        setArrowTo({id: node.id, anchor: anchor});
                    }
                }}
                onConnectingUnhover={(e)=>{
                    setArrowTo({id: -1, anchor: -1});
                }}
                onConnected={(e,anchor)=>onNodeConnected(e,node.id,anchor)}
                headerListening={!isDrawingArrow &&
                    !isDrawingDoubleArrow&&!isSectioning&&!isAddingKeyword}
                disabledSet={node.disabledTaskId}
                onHeaderTaskClick={(task_id)=>handleHeaderTaskClick(task_id,"node",node.id)}
                callbackTaskId={node.callbackTaskId}
                resetNodeCallbackTaskId={()=>resetNodeCallbackTaskId(node.id)}
                header={isTaskHeaderVisible}/> :
                node.type === "concept" ?
                <Concept
                key={node.id}
                x={node.x}
                y={node.y}
                scaleX={node.scaleX}
                scaleY={node.scaleY}
                radiusX={node.radiusX}
                radiusY={node.radiusY}
                text={node.text}
                fontSize={node.fontSize}
                color={"#FFB5B7"}
                isNull={node.text===""}
                isSelected={node.selected}
                onClick={(e)=>onNodeSelect(e,node.id)}
                onScale={(newScale, newX, newY)=>onNodeScale(node.id, newScale, newX, newY)}
                onResize={(offsetW,offsetH)=>{
                    if (node.radiusX+offsetW >= 36 && node.radiusY+offsetH >=20) {
                        setNodes(prevState => {
                            return prevState.map(state => {
                                let tmp = state;
                                if (tmp.id === node.id) {
                                    tmp.radiusX += offsetW;
                                    tmp.radiusY += offsetH;
                                }
                                return tmp;
                            });
                        });
                    }
                }}
                onTextChange={(value)=>onNodeTextChange(value,node.id)}
                onOverflow={(scrollHeight)=>{
                    setNodes(prevState =>{
                        return prevState.map(state => {
                            let tmp = state;
                            if (tmp.id === node.id)
                                tmp.radiusY = scrollHeight;
                            return tmp;
                        });
                    })
                }}
                isConnecting={isDrawingArrow || isDrawingDoubleArrow}
                onConnectingHover={(e,anchor)=>{
                    if (arrowFrom.id !== -1) {
                        setArrowTo({id: node.id, anchor: anchor});
                    }
                }}
                onConnectingUnhover={(e)=>{
                    setArrowTo({id: -1, anchor: -1});
                }}
                onConnected={(e,anchor)=>onNodeConnected(e,node.id,anchor)}
                onDragMove={(e)=>{handleDragNodeMove(e,node.id)}}
                onDragEnd={(e)=>{handleDragNodeEnd(e,node.id)}}
                headerListening={!isDrawingArrow &&
                    !isDrawingDoubleArrow&&!isSectioning&&!isAddingKeyword}
                disabledSet={node.disabledTaskId}
                onHeaderTaskClick={(task_id)=>handleHeaderTaskClick(task_id,"node",node.id)}
                callbackTaskId={node.callbackTaskId}
                resetNodeCallbackTaskId={()=>resetNodeCallbackTaskId(node.id)}
                header={isTaskHeaderVisible}
                /> : null : null
            })}
            {taskNodes.map(node=>{
                return (
                    <TaskNode
                    key={node.node_id}
                    type={node.type}
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    radiusX={node.radiusX}
                    radiusY={node.radiusY}
                    text={node.text}
                    fontSize={node.fontSize}
                    color={colorPalette[node.task_id]}/>
                )
            })}
            {arrows.map((arrow,index)=>{
                const arrow_size = 10 / canvasScale;
                const arrow_dy = arrow.to_anchor===0 ? 1 : arrow.to_anchor===2 ? -1 : 0;
                const arrow_dx = arrow.to_anchor===1 ? 1 : arrow.to_anchor===3 ? -1 : 0;
                const finalAnchor = anchor_utils.calcAnchorPosition(
                    arrow.to_anchor, getNodeById(arrow.to_id), canvasScale);
                return (
                <Group
                key={index}>
                <MyLine
                points={[
                    ...anchor_utils.calcAnchorPosition(
                        arrow.from_anchor, getNodeById(arrow.from_id), canvasScale),
                    ...anchor_utils.findPathBetweenNodes(arrow.from_anchor, arrow.to_anchor,
                        getNodeById(arrow.from_id),getNodeById(arrow.to_id), canvasScale),
                    // ...calcAnchorOffset(arrow.from_anchor, nodes[arrow.from_id]),
                    // ...calcAnchorOffset(arrow.to_anchor, nodes[arrow.to_id]),
                    ...finalAnchor
                ]}
                tension={0}
                stroke={"gray"}
                strokeWidth={2/canvasScale}
                />
                {/* <Line
                points={[...finalAnchor,
                finalAnchor[0]+arrow_dx*5, finalAnchor[1]+arrow_dy*5]}
                tension={0}
                stroke={"gray"}
                strokeWidth={2/canvasScale}
                /> */}
                {arrow.directed ? <Group>
                <Line
                points={[finalAnchor[0]-arrow_dx*arrow_size+arrow_dy*arrow_size,
                    finalAnchor[1]-arrow_dy*arrow_size+arrow_dx*arrow_size,
                    ...finalAnchor]}
                    // finalAnchor[0]+arrow_dx*10, finalAnchor[1]+arrow_dy*10]}
                tension={0}
                stroke={"gray"}
                strokeWidth={2/canvasScale}/>
                <Line
                points={[finalAnchor[0]-arrow_dx*arrow_size-arrow_dy*arrow_size,
                    finalAnchor[1]-arrow_dy*arrow_size-arrow_dx*arrow_size,
                    ...finalAnchor]}
                    // finalAnchor[0]+arrow_dx*10, finalAnchor[1]+arrow_dy*10]}
                tension={0}
                stroke={"gray"}
                strokeWidth={2/canvasScale}/>
                </Group>: null}
                </Group>
                )
            })}
            {
                arrowFrom.id!==-1 ? (
                arrowTo.id===-1 ?
                <MyLine
                points={[
                    ...anchor_utils.calcAnchorPosition(arrowFrom.anchor,getNodeById(arrowFrom.id), canvasScale),
                    ...findPathBetweenNodeAndPointer(arrowFrom.anchor,getNodeById(arrowFrom.id)),
                    ]}
                stroke={"gray"}
                listening={false}
                strokeWidth={2/canvasScale}
                /> :
                <MyLine
                points={[
                    ...anchor_utils.calcAnchorPosition(arrowFrom.anchor,getNodeById(arrowFrom.id),canvasScale),
                    ...anchor_utils.findPathBetweenNodes(arrowFrom.anchor,arrowTo.anchor,
                        getNodeById(arrowFrom.id), getNodeById(arrowTo.id), canvasScale),
                    ...anchor_utils.calcAnchorPosition(arrowTo.anchor,getNodeById(arrowTo.id),canvasScale)
                    ]}
                stroke={"gray"}
                listening={false}
                strokeWidth={2/canvasScale}
                />)
                : null
            }
            </CanvasContext.Provider>
            </Group>
        </Layer>
        <Layer>
            <TaskBoard
            x={dimensions.width-360}
            y={25}
            width={300}
            height={dimensions.height-50}
            tasks={microTasks}
            listening={!isDrawingArrow && !isDrawingDoubleArrow
            && !isSectioning && ! isAddingKeyword}
            deleteTask={(id)=>{
                setMicroTasks(prevState=>prevState.filter(state=>state.id!==id));
                setTaskNodes(prevState=>prevState.filter(state=>state.task_id!==id));
            }}
            toggleTaskHeaderSwitch={()=>setIsTaskHeaderVisible(!isTaskHeaderVisible)}/>

            {/* {followerPositionQueue.map((position,index)=>{
                return <TaskPrompt
                key={index}
                x={position.x}
                y={position.y}
                width={120}
                height={20}
                color={"orange"}
                fontSize={10}
                text={"Brainstorm a list of keywords related to \"Interaction\""}/>
            })} */}
            
            {/* <Group>
            {followerPositionQueue.map((position,index)=>{
                return <TaskPrompt
                key={index}
                x={position.x}
                y={position.y}
                width={200}
                height={100}
                color={"orange"}
                fontSize={16}
                text={"Brainstorm a list of keywords related to \"Interaction\""}/>
            })}
            </Group>   */}

            {/* <Group> */}
            {/* <PrompterContext.Provider value={{promptCardsRef}}> */}
                {/* {promptCards.map((prompt_card,index)=>{
                    return prompt_card.display ?
                    <Prompter
                    key={index+1}
                    id={index+1}
                    x={prompt_card.x}
                    y={prompt_card.y}
                    width={prompt_card.width}
                    height={prompt_card.height}
                    fontSize={15}
                    text={prompt_card.text}
                    onDragEnd={(e) => setPrompterPosition(e, index)}
                    /> : null
                })} */}
                {/* <Prompter
                id={0}
                x={mainPrompter.x}
                y={mainPrompter.y}
                width={mainPrompter.width}
                height={mainPrompter.height}
                fontSize={18}
                text={mainPrompter.prompt}
                onHover={onMainPrompterHover}
                onUnhover={onMainPrompterUnhover}
                // onTextChange={(value)=>{setGlobalState("prompt",value);}}
                draggable={false}
                /> */}
            {/* </PrompterContext.Provider> */}
            {/* </Group> */}
            {/* <PromptPanel
            x={promptPanelPosition.x}
            y={promptPanelPosition.y}
            width={300}
            height={40}
            fontSize={12}
            visible={promptPanelVisibility}
            prompts={["prompt_1",
            "Brainstorm keywords related to \"recursive\"",
            "What are some potential subtopics related to \"recursive\" in the context of \"prewriting\"?",
            "How is \"unstructured\" related to \"prewriting\"?",
            "prompt_5"]}
            /> */}
            <ToolBar
                x={mainPrompter.x+mainPrompter.width/2-285}
                y={mainPrompter.y-50}
                width={615}
                height={60}
                color={"white"}
                onHover={()=>setIsHoverToolBar(true)}
                onUnhover={()=>setIsHoverToolBar(false)}
                visible={toolBarVisibility}
                isArrowIconClicked={isDrawingArrow}
                onArrowIconClick={(e)=>{
                    e.cancelBubble = true;
                    UnselectAllNodes();
                    setIsDrawingDoubleArrow(false);
                    setIsAddingKeyword(false);
                    setIsSectioning(false);
                    setIsDrawingArrow(!isDrawingArrow);
                }}
                isDoubleArrowIconClicked={isDrawingDoubleArrow}
                onDoubleArrowIconClick={(e)=>{
                    e.cancelBubble = true;
                    UnselectAllNodes();
                    setIsDrawingArrow(false);
                    setIsAddingKeyword(false);
                    setIsSectioning(false);
                    setIsDrawingDoubleArrow(!isDrawingDoubleArrow);
                }}
                isSectionIconClicked={isSectioning}
                onSectionIconClick={(e)=>{
                    e.cancelBubble = true;
                    UnselectAllNodes();
                    setIsDrawingArrow(false);
                    setIsDrawingDoubleArrow(false);
                    setIsAddingKeyword(false);
                    setIsSectioning(!isSectioning);
                }}
                isTextIconClicked={isAddingKeyword}
                onTextIconClick={(e)=>{
                    e.cancelBubble = true;
                    UnselectAllNodes();
                    setIsDrawingArrow(false);
                    setIsDrawingDoubleArrow(false);
                    setIsSectioning(false);
                    setIsAddingKeyword(!isAddingKeyword);
                }}
                onAddConcept={(x,y,radiusX,radiusY)=>{
                    setNodes(prevState => {
                        let tmp = {id: numNodes, type: "concept",
                        x: (x-canvasX)/canvasScale, y: (y-canvasY)/canvasScale,
                        radiusX: radiusX, radiusY: radiusY,
                        scaleX: 1/canvasScale, scaleY: 1/canvasScale,
                        selected: false, text: "", fontSize: 20, display: true,
                        disabledTaskId: new Set(),
                        callbackTaskId: -1};
                        return [...prevState, tmp];
                    });
                    setNumNodes(numNodes+1);
                }}
                onAddStickyNote={(x, y, width, height)=>{
                    setNodes(prevState => {
                        let tmp = {id: numNodes, type: "sticky_note",
                        x: (x-canvasX)/canvasScale, y: (y-canvasY)/canvasScale,
                        width: width, height: height, fontSize: 18,
                        scaleX: 1/canvasScale, scaleY: 1/canvasScale,
                        selected: false, text: "", display: true,
                        disabledTaskId: new Set(),
                        callbackTaskId: -1};
                        return [...prevState, tmp];
                    });
                    setNumNodes(numNodes+1);
                }}
            />

            <Rect fill="#0099FF"
            opacity={0.12}
            visible={selectionRect.visible} ref={selectionRectRef}
            x={Math.min(selectionRect.x1, selectionRect.x2)}
            y={Math.min(selectionRect.y1, selectionRect.y2)}
            width={Math.abs(selectionRect.x1 - selectionRect.x2)}
            height={Math.abs(selectionRect.y1 - selectionRect.y2)}/>
        </Layer>
    </Stage>
    </HotKeys>
    )
}


/* deprecated */

    // const toggleFollowerMode = () => {
    //     if (!isFollowerModeEnabled) {
    //         followerProcess.current = setInterval(() => {
    //             const position = stageRef.current.getPointerPosition();
    //             if (position) {
    //                 followerPositionQueue.push({
    //                     x: position.x+(Math.random()-0.8)*40,
    //                     y: position.y+(Math.random()-0.8)*40})
    //             }
    //             if (followerPositionQueue.length === 6) {
    //                 followerPositionQueue.shift();
    //             }
    //             setFollowerPositionQueue(followerPositionQueue);
    //         }, 200);
    //     } else {
    //         clearInterval(followerProcess.current);
    //         setFollowerPositionQueue([]);
    //     }
    //     setIsFollowerModeEnabled(!isFollowerModeEnabled)
    // }

    // const calcAnchorPosition = (anchor, node) => {
    //     const anchorPosition = node.type === "sticky_note" ? [
    //         [node.x + (node.width + 35)*node.scaleX / 2, node.y-20/canvasScale],
    //         [node.x-20/canvasScale, node.y + (node.height + 70)*node.scaleY / 2],
    //         [node.x + (node.width + 35)*node.scaleX / 2, node.y + (node.height + 70)*node.scaleY + 20/canvasScale],
    //         [node.x + (node.width + 35)*node.scaleX + 20/canvasScale, node.y + (node.height + 70)*node.scaleY / 2]
    //     ] : node.type === "keyword" ? [
    //         [node.x + node.width/canvasScale / 2, node.y-15/canvasScale],
    //         [node.x-15/canvasScale, node.y + node.height/canvasScale / 2],
    //         [node.x + node.width/canvasScale / 2, node.y + node.height/canvasScale + 15/canvasScale],
    //         [node.x + node.width/canvasScale + 15/canvasScale, node.y + node.height/canvasScale / 2]
    //     ] : node.type === "concept" ? [
    //         [node.x, node.y - node.radiusY*node.scaleY - 15/canvasScale],
    //         [node.x - node.radiusX*node.scaleX - 15/canvasScale, node.y],
    //         [node.x, node.y + node.radiusY*node.scaleY + 15/canvasScale],
    //         [node.x + node.radiusX*node.scaleX + 15/canvasScale, node.y]
    //     ] : []
    //     return anchorPosition[anchor];
    // }

    // const calcAnchorOffsetPositions = (node) => {
    //     const anchorOffset = node.type === "sticky_note" ? [
    //         [node.x + (node.width + 35)*node.scaleX / 2, node.y-50/canvasScale],
    //         [node.x-50/canvasScale, node.y + (node.height + 70)*node.scaleY / 2],
    //         [node.x + (node.width + 35)*node.scaleX / 2, node.y + (node.height + 70)*node.scaleY + 50/canvasScale],
    //         [node.x + (node.width + 35)*node.scaleX + 50/canvasScale, node.y + (node.height + 70)*node.scaleY / 2]
    //     ] : node.type === "keyword" ? [
    //         [node.x + node.width/canvasScale / 2, node.y-40/canvasScale],
    //         [node.x-40/canvasScale, node.y + node.height/canvasScale / 2],
    //         [node.x + node.width/canvasScale / 2, node.y + node.height/canvasScale + 40/canvasScale],
    //         [node.x + node.width/canvasScale + 40/canvasScale, node.y + node.height/canvasScale / 2]
    //     ] : node.type === "concept" ? [
    //         [node.x, node.y - node.radiusY*node.scaleY - 40/canvasScale],
    //         [node.x - node.radiusX*node.scaleX - 40/canvasScale, node.y],
    //         [node.x, node.y + node.radiusY*node.scaleY + 40/canvasScale],
    //         [node.x + node.radiusX*node.scaleX + 40/canvasScale, node.y]
    //     ] : [];

    //     return anchorOffset;
    // }

    // const findPathBetweenVectors = (from, to) => {
    //     var points = []
    //     if (from.dx === to.dx && from.dx !== 0) {
    //         const borderX = from.dx > 0 ? Math.max(from.x, to.x) : Math.min(from.x, to.x);
    //         points = [borderX, from.y, borderX, to.y];
    //         // if ((from.x-to.x)*from.dx < 0 && Math.abs(from.y-to.y) < to.height/2) {
    //         //     // points = [(to.x-from.dx*to.width-from.x)/2+from.x, from.y,
    //         //     // (to.x-from.dx*to.width-from.x)/2+from.x, to.y+(to.height/2)*(from.y>to.y?1:-1),
    //         //     // borderX, to.y+(to.height/2)*(from.y>to.y?1:-1)
    //         //     // ]
    //         // } else if ((from.x-to.x)*from.dx > 0 && Math.abs(from.y-to.y) < from.height/2) {
    //         // //     points = [
    //         // //     borderX, to.y+(to.height/2)*(from.y>to.y?-1:1),
    //         // //     (from.x-from.dx*from.width-to.x)/2+to.x, to.y+(to.height/2)*(from.y>to.y?-1:1),
    //         // //     (from.x-from.dx*from.width-to.x)/2+to.x, to.y,
    //         // //    ]
    //         // } else {
    //         //     points = [borderX, from.y, borderX, to.y];
    //         // }
    //     }
    //     if (from.dx === -to.dx && from.dx !== 0) {
    //         const middleX = (from.x+to.x) / 2;
    //         const middleY = (from.y+to.y) / 2;
    //         if (from.dx*(to.x-from.x) > 0) {
    //             points = [middleX, from.y, middleX, to.y];
    //         } else {
    //             points = [from.x, middleY, to.x, middleY];
    //         }
    //     }
    //     if (from.dy === to.dy && from.dy !== 0) {
    //         const borderY = from.dy > 0 ? Math.max(from.y, to.y) : Math.min(from.y, to.y);
    //         points = [from.x, borderY, to.x, borderY];
    //     }
    //     if (from.dy === -to.dy && from.dy !== 0) {
    //         const middleX = (from.x+to.x) / 2;
    //         const middleY = (from.y+to.y) / 2;
    //         if (from.dy*(to.y-from.y) > 0) {
    //             points = [from.x, middleY, to.x, middleY];
    //             // points = [middleX, from.y, middleX, to.y];
    //         } else {
    //             // points = [from.x, middleY, to.x, middleY];
    //             points = [middleX, from.y, middleX, to.y];
    //         }
    //     }

    //     if (from.dx*to.dy !== 0) {
    //         if ((to.x-from.x)*from.dx < 0 || (to.y-from.y)*to.dy > 0) {
    //             points = [from.x, to.y]
    //         } else {
    //             points = [to.x, from.y]
    //         }
    //     }
    //     if (from.dy*to.dx !== 0) {
    //         if ((to.y-from.y)*from.dy < 0 || (to.x-from.x)*to.dx > 0) {
    //             points = [to.x, from.y]
    //         } else {
    //             points = [from.x, to.y]
    //         }
    //     }
        
    //     return points;
    // }

    // const findPathBetweenNodes = (fromAnchor, toAnchor, fromNode, toNode, canvasScale) => {
    //     const fromAnchorOffset = calcAnchorOffsetPositions(fromNode, canvasScale);
    //     const toAnchorOffset = calcAnchorOffsetPositions(toNode, canvasScale);

    //     const from = {x: fromAnchorOffset[fromAnchor][0],
    //     y: fromAnchorOffset[fromAnchor][1],
    //     dx: (fromAnchor%2)*parseInt(2*(fromAnchor/2-1)),
    //     dy: ((fromAnchor+1)%2)*parseInt(2*(fromAnchor/2-0.5)),
    //     width: (fromNode.width + 35)*fromNode.scaleX + 40/canvasScale,
    //     height: (fromNode.height + 70)*fromNode.scaleY + 40/canvasScale}

    //     const to = {x: toAnchorOffset[toAnchor][0],
    //         y: toAnchorOffset[toAnchor][1],
    //         dx: (toAnchor%2)*parseInt(2*(toAnchor/2-1)),
    //         dy: ((toAnchor+1)%2)*parseInt(2*(toAnchor/2-0.5)),
    //         width: (toNode.width + 35)*toNode.scaleX + 40/canvasScale,
    //         height: (toNode.height + 70)*toNode.scaleY + 40/canvasScale}

    //     return [...fromAnchorOffset[fromAnchor],
    //     ...findPathBetweenVectors(from,to),
    //     ...toAnchorOffset[toAnchor]]
    // }
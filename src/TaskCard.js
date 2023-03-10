import React, { useEffect, useState } from "react";
import { Group, Rect, Label, Tag, Text, Line } from "react-konva";

import { Icon } from "./Icon";
import { colorMap } from "./utils/color_utils";


export function TaskCard({
    x,y,
    width,
    height,
    color,
    goal,
    inputType,
    outputType,
    examplePrompt,
    deleteTask
})
{
    const [isHover, setIsHover] = useState(false);
    const [pageNum, setPageNum] = useState(0);
    
    const rectRef = React.useRef(null);
    const cardRef = React.useRef(null);
    const expandIconRef = React.useRef(null);
    const page1Ref = React.useRef(null);
    const page2Ref = React.useRef(null);
    // const colorMap = {
    //     "Keyword": "#AFC6D9",
    //     "Concept": "#5880A2",
    //     "Sticky Note": "#003A6B",
    //     "Section": "#80D8FF",
    //     "Nodes": "#112233",
    //     "Lines": "#C3E7FD"
    // }

    useEffect(()=>{
        if (pageNum===0) {
            page1Ref.current.setAttrs({opacity: 0});
            page1Ref.current.to({opacity: 1});
        } else {
            page2Ref.current.setAttrs({opacity: 0});
            page2Ref.current.to({opacity: 1});
        }
    }, [pageNum])

    return (
    <Group
    x={x}
    y={y}
    ref={cardRef}
    onMouseEnter={()=>{
        setIsHover(true);
        // rectRef.current.to({height: height+75, duration: 0.25})
    }}
    onMouseLeave={()=>{
        setIsHover(false);
        // rectRef.current.to({height: height, duration: 0.25})
    }}>
        <Rect
        x={0}
        y={0}
        ref={rectRef}
        width={width}
        height={height}
        cornerRadius={10}
        fill={"#F7F7F7"}
        strokeWidth={0.12}
        stroke={"#010203"}
        shadowColor={"grey"}
        shadowOffsetY={1.5}
        shadowOffsetX={0}
        shadowBlur={2.5}
        shadowOpacity={0.32}
        // strokeWidth={0.25}
        // stroke={"grey"}
        // shadowColor={"black"}
        // shadowOffsetY={1.5}
        // shadowOffsetX={0}
        // shadowBlur={2.5}
        // shadowOpacity={0.32}
        />

        <Group
        x={width/2}
        y={height-15}
        onMouseEnter={(e)=>{
            // e.target.setAttrs({stroke: "black"});
            e.target.getStage().container().style.cursor = "pointer"
        }}
        onMouseLeave={(e)=>{
            // e.target.setAttrs({stroke: "silver"});
            e.target.getStage().container().style.cursor = "default"
        }}
        onClick={()=>{
            setPageNum((pageNum+1)%2);
        }}
        ref={expandIconRef}>
            {pageNum===0? <Line
            points={[-15,0,0,5,15,0]}
            stroke={"silver"}
            /> : <Line
            points={[-15,5,0,0,15,5]}
            stroke={"silver"}
            />}
            <Rect
            x={-17.5}
            y={-2.5}
            width={35}
            height={7.5}
            fill={"transparent"}/>
        </Group>

        <Icon
        x={width-20}
        y={20}
        type={"delete"}
        onClick={deleteTask}/>
        
        <Label
        x={10}
        y={10}
        >
            <Tag
            fill={color}
            cornerRadius={5}
            />
            <Text
            text={goal}
            fontSize={18}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label>

        <Group
        ref={page1Ref}
        visible={!pageNum}>
        <Label
        x={width/2}
        y={65}
        >
            <Tag
            // fill={"#B0B3B8"}
            fill={"#C0C2CE"}
            cornerRadius={5}
            // stroke={"#010203"}
            // strokeWidth={0.12}
            pointerDirection={"right"}
            pointerWidth={5}
            pointerHeight={5}
            lineJoin={'round'}
            />
            <Text
            text={"Input Type"}
            fontSize={14}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label>
        <Label
        x={width/2+5}
        y={65}
        >
            <Tag
            fill={colorMap[inputType]}
            // fill={inputType==="Sticky Note" ? "#003A6B"
            // : inputType==="Concept" ? "#5880A2"
            // : inputType==="Keyword" ? "#AFC6D9" : "#80D8FF"}
            cornerRadius={5}
            pointerDirection={"left"}
            // pointerWidth={5}
            // pointerHeight={5}
            lineJoin={'round'}
            />
            <Text
            text={inputType}
            fontSize={14}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label>
        
        <Label
        x={width/2}
        y={95}
        >
            <Tag
            // fill={"#B0B3B8"}
            fill={"#C0C2CE"}
            cornerRadius={5}
            // stroke={"#010203"}
            // strokeWidth={0.12}
            pointerDirection={"right"}
            pointerWidth={5}
            pointerHeight={5}
            lineJoin={'round'}
            />
            <Text
            text={"Output Type"}
            fontSize={14}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label>
        <Label
        x={width/2+5}
        y={95}
        >
            <Tag
            fill={colorMap[outputType]}
            // fill={outputType==="Sticky Note" ? "#003A6B"
            // : outputType==="Concept" ? "#5880A2"
            // : outputType==="Keyword" ? "#AFC6D9"  : "#80D8FF"}
            cornerRadius={5}
            pointerDirection={"left"}
            // pointerWidth={5}
            // pointerHeight={5}
            lineJoin={'round'}
            />
            <Text
            text={outputType}
            fontSize={14}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label>
        </Group>

        <Group
        ref={page2Ref}
        visible={pageNum===1}>
        <Label
        x={width/2-15}
        y={80}
        >
            <Tag
            // fill={"#B0B3B8"}
            fill={"#C0C2CE"}
            cornerRadius={5}
            // stroke={"#010203"}
            // strokeWidth={0.12}
            pointerDirection={"right"}
            pointerWidth={5}
            pointerHeight={5}
            lineJoin={'round'}
            />
            <Text
            text={"Example Prompt"}
            fontSize={12}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label>
        <Label
        x={width/2-12}
        y={80}
        >
            <Tag
            x={0}
            y={-17}
            fill={"#AFAFAF"}
            cornerRadius={5}
            pointerDirection={"left"}
            lineJoin={'round'}
            />
            <Text
            x={0}
            y={-17}
            text={examplePrompt}
            width={width/2+5}
            height={height-80}
            ellipsis={true}
            fontSize={12}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}
            />
        </Label>
        </Group>
        {/* <Label
        x={width/2-50}
        y={150}
        >
            <Tag
            fill={"#B0B3B8"}
            cornerRadius={5}
            pointerDirection={"down"}
            pointerWidth={5}
            pointerHeight={5}
            lineJoin={'round'}
            />
            <Text
            text={"Example Prompt"}
            fontSize={14}
            fontStyle={"bold"}
            fontFamily={"sans-serif"}
            fill={"white"}
            padding={5}/>
        </Label> */}
    </Group>
    )
}
import React, { useEffect, useRef, useState } from "react";
import { Group, Rect, Text, Circle } from "react-konva";

const duration = 0.15;


export function PanelItem({
    x,
    y,
    width,
    height,
    fontSize,
    text,
}) {
    const [isHover, setIsHover] = React.useState(false);
    const textRef = React.useRef(null);
    const rectRef = React.useRef(null);
    const circleRef = React.useRef(null);

    const handleHover = () => {
        setIsHover(true);
        if (rectRef) {
            rectRef.current.to({
                x: 20, y: 0,
                width: width,
                height: height,
                duration: duration,
            })
        }
        if (textRef) {
            textRef.current.ellipsis(false);
            textRef.current.to({
                x: 30, y: 8,
                width: width-10,
                height: height-16,
                // onFinish: ()=>{
                //     textRef.current.setAttrs({text: text})
                // },
                duration: duration
            })
        }
        if (circleRef) {
            circleRef.current.to({
                x: 0, y: height/2,
                radius: 20,
                duration: duration
            })
        }
    }
    const handleUnhover = () => {
        setIsHover(false);
        if (rectRef) {
            rectRef.current.to({
                x: 20, y: 0,
                width: 240,
                height: 32,
                duration: duration
            })
        }
        if (textRef) {
            textRef.current.ellipsis(true);
            textRef.current.to({
                x: 60, y: 8,
                width: 195,
                height: 16,
                // onFinish: ()=>{
                //     textRef.current.setAttrs({text: text})
                // },
                duration: duration
            })
        }
        if (circleRef) {
            circleRef.current.to({
                x: 36, y: 16,
                radius: 16,
                duration: duration
            })
        }
    }

    return (
        <Group
        x={x}
        y={y}
        opacity={isHover?1:0.7}
        onMouseEnter={(e)=>handleHover()}
        onMouseLeave={(e)=>handleUnhover()}
        >
            <Rect
            ref={rectRef}
            x={20}
            y={0}
            fill={"#D3D3D3"}
            // stroke={"#010203"}
            // strokeWidth={0.25}
            cornerRadius={16}
            width={240}
            height={32}
            />
            <Text
            ref={textRef}
            x={60}
            y={8}
            text={text}
            width={195}
            height={16}
            fontSize={fontSize}
            ellipsis={true}
            fill={"black"}
            fontStyle={"italic bold"}
            fontFamily={"sans-serif"}
            />
            <Circle
            ref={circleRef}
            x={36}
            y={16}
            radius={16}
            fill={'#010203'}
            />
        </Group>
    )
}
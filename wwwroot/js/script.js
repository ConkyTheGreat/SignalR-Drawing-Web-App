"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/drawHub").withAutomaticReconnect().build();

connection.on("newMessage", console.log);

//connection.on("startNewStroke", (startingCoordinates) => {
//    //console.log("new coordinates received");
//    //console.dir(startingCoordinates);

//    ctx.beginPath();
//    ctx.moveTo(startingCoordinates.StartPosX, startingCoordinates.StartPosY);
//});

connection.on("initializeNewStroke", (newStrokeObject) => {
    ctx.beginPath();
    ctx.lineWidth = newStrokeObject.LineWidth;
    ctx.strokeStyle = newStrokeObject.StrokeStyle;
    ctx.fillStyle = newStrokeObject.FillStyle;
    ctx.moveTo(newStrokeObject.StartPosX, newStrokeObject.StartPosY);
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); 
});

connection.on("drawStroke", (strokeTool) => {
    ctx.putImageData(snapshot, 0, 0); 

    //console.dir(strokeTool);

    //ctx.beginPath();

    //ctx.lineWidth = strokeTool.LineWidth;
    ctx.strokeStyle = strokeTool.StrokeStyle;
    //ctx.fillStyle = strokeTool.FillStyle;

    ctx.lineTo(strokeTool.MousePosX, strokeTool.MousePosY); 
    ctx.stroke(); 

    //ctx.closePath();

})

connection.on("drawCircle", (circle) => {
    ctx.putImageData(snapshot, 0, 0); // adding copied canvas data on to this canvas

    //console.dir(circle);

    ctx.beginPath(); // creating new path to draw circle
    let radius = circle.Radius;
    ctx.arc(circle.MousePreviousPosX, circle.MousePreviousPosY, radius, 0, 2 * Math.PI); // creating circle according to the mouse pointer
    circle.FillColor ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill circle else draw border circle
})

connection.start().catch(err => console.error(err.toString()));

const canvas = document.querySelector("canvas"),
toolBtns = document.querySelectorAll(".tool"),
fillColor = document.querySelector("#fill-color"),
sizeSlider = document.querySelector("#size-slider"),
colorBtns = document.querySelectorAll(".colors .option"),
colorPicker = document.querySelector("#color-picker"),
clearCanvas = document.querySelector(".clear-canvas"),
saveImg = document.querySelector(".save-img"),
ctx = canvas.getContext("2d");

// global variables with default value
let prevMouseX, prevMouseY, snapshot, clientPrevMouseX, clientPrevMouseY, mouseX, mouseY,
isDrawing = false,
selectedTool = "brush",
brushWidth = 5,
selectedColor = "#000";

const setCanvasBackground = () => {
    // setting whole canvas background to white, so the downloaded img background will be white
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor; // setting fillstyle back to the selectedColor, it'll be the brush color
}

window.addEventListener("load", () => {
    // setting canvas width/height.. offsetwidth/height returns viewable width/height of an element
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setCanvasBackground();
});

const drawRect = (e) => {
    // if fillColor isn't checked draw a rect with border else draw rect with background
    if(!fillColor.checked) {
        // creating circle according to the mouse pointer
        return ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
    }
    ctx.fillRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
}

const drawCircle = (e) => {
    ctx.beginPath(); // creating new path to draw circle
    // getting radius for circle according to the mouse pointer
    let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI); // creating circle according to the mouse pointer
    fillColor.checked ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill circle else draw border circle

    let circle = {
        MousePreviousPosX: prevMouseX,
        MousePreviousPosY: prevMouseY,
        Radius: radius,
        FillColor: fillColor.checked
    }

    connection.invoke("DrawCircle", circle);
}

const drawTriangle = (e) => {
    ctx.beginPath(); // creating new path to draw circle
    ctx.moveTo(prevMouseX, prevMouseY); // moving triangle to the mouse pointer
    ctx.lineTo(e.offsetX, e.offsetY); // creating first line according to the mouse pointer
    ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY); // creating bottom line of triangle
    ctx.closePath(); // closing path of a triangle so the third line draw automatically
    fillColor.checked ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill triangle else draw border
}

const startDraw = (e) => {
    isDrawing = true;
    prevMouseX = e.offsetX; // passing current mouseX position as prevMouseX value
    prevMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
    //clientPrevMouseX = e.offsetX;
    //clientPrevMouseY = e.offsetY;
    ctx.beginPath(); // creating new path to draw
    ctx.lineWidth = brushWidth; // passing brushSize as line width
    ctx.strokeStyle = selectedColor; // passing selectedColor as stroke style
    ctx.fillStyle = selectedColor; // passing selectedColor as fill style
    // copying canvas data & passing as snapshot value.. this avoids dragging the image
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let newStrokeObject = {
        StartPosX: e.offsetX,
        StartPosY: e.offsetY,
        LineWidth: Number(brushWidth),
        StrokeStyle: ctx.strokeStyle,
        FillStyle: ctx.strokeStyle
    }

    //connection.invoke("StartNewStroke", { StartPosX: e.offsetX, StartPosY: e.offsetY });
    connection.invoke("InitializeNewStroke", newStrokeObject);
}

const drawing = (e) => {
    if(!isDrawing) return; // if isDrawing is false return from here
    ctx.putImageData(snapshot, 0, 0); // adding copied canvas data on to this canvas

    if(selectedTool === "brush" || selectedTool === "eraser") {
        // if selected tool is eraser then set strokeStyle to white 
        // to paint white color on to the existing canvas content else set the stroke color to selected color
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;

        //clientPrevMouseX = e.offsetX;
        //clientPrevMouseY = e.offsetY;

        //mouseX = e.offsetX;
        //mouseY = e.offsetY;

        ctx.lineTo(e.offsetX, e.offsetY); // creating line according to the mouse pointer
        //ctx.lineTo(mouseX, mouseY);
        ctx.stroke(); // drawing/filling line with color

        //let strokeTool = {
        //    MousePosX: e.offsetX,
        //    MousePosY: e.offsetY,
        //    MousePreviousPosX: clientPrevMouseX,
        //    MousePreviousPosY: clientPrevMouseY,
        //    LineWidth: Number(brushWidth),
        //    StrokeStyle: ctx.strokeStyle,
        //    FillStyle: ctx.strokeStyle
        //};

        let strokeTool = {
            MousePosX: e.offsetX,
            MousePosY: e.offsetY,
            StrokeStyle: ctx.strokeStyle
        };

        connection.invoke("DrawStroke", strokeTool);

        /*
        Update previous mouse positions to most recent position, 
        otherwise line gets drawn across the screen to new starting point
        */
        //clientPrevMouseX = e.offsetX;
        //clientPrevMouseY = e.offsetY;
        //clientPrevMouseX = mouseX;
        //clientPrevMouseY = mouseY;

    } else if(selectedTool === "rectangle"){
        drawRect(e);
    } else if(selectedTool === "circle"){
        drawCircle(e);
    } else {
        drawTriangle(e);
    }
}

toolBtns.forEach(btn => {
    btn.addEventListener("click", () => { // adding click event to all tool option
        // removing active class from the previous option and adding on current clicked option
        document.querySelector(".options .active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

sizeSlider.addEventListener("change", () => brushWidth = sizeSlider.value); // passing slider value as brushSize

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => { // adding click event to all color button
        // removing selected class from the previous option and adding on current clicked option
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        // passing selected btn background color as selectedColor value
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    });
});

colorPicker.addEventListener("change", () => {
    // passing picked color value from color picker to last color btn background
    colorPicker.parentElement.style.background = colorPicker.value;
    colorPicker.parentElement.click();
});

clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clearing whole canvas
    setCanvasBackground();
});

saveImg.addEventListener("click", () => {
    const link = document.createElement("a"); // creating <a> element
    link.download = `${Date.now()}.jpg`; // passing current date as link download value
    link.href = canvas.toDataURL(); // passing canvasData as link href value
    link.click(); // clicking link to download image
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);
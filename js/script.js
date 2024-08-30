// Canvas and context initialization
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Control elements
const flavor1Input = document.getElementById('flavor1');
const flavor2Input = document.getElementById('flavor2');
const waterInput = document.getElementById('water');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const resetButton = document.getElementById('resetButton');

// Percentage display elements
const flavor1ValueSpan = document.getElementById('flavor1Value');
const flavor2ValueSpan = document.getElementById('flavor2Value');
const waterValueSpan = document.getElementById('waterValue');

// Simulation variables
let isMixing = false;
let animationFrameId;

// Canvas dimensions
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Tank class definition
class Tank {
    constructor(x, y, width, height, name, level = 0, colors = [], hasWindow = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.level = level;
        this.targetLevel = level;
        this.colors = colors;
        this.hasWindow = hasWindow;
    }

    draw() {
        // Draw the tank
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw liquid bands
        let currentHeight = this.y + this.height;
        const totalHeight = (this.level / 100) * this.height;

        if (this.colors.length > 0) {
            this.colors.forEach(({ color, percentage }) => {
                const segmentHeight = (percentage / 100) * totalHeight;
                ctx.fillStyle = color;
                ctx.fillRect(this.x, currentHeight - segmentHeight, this.width, segmentHeight);
                currentHeight -= segmentHeight;
            });
        } else {
            ctx.fillStyle = '#FFFFFF'; // Default color if no colors
            ctx.fillRect(this.x, currentHeight - totalHeight, this.width, totalHeight);
        }

        // Draw window and status light
        if (this.hasWindow) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.strokeRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
        }

        ctx.fillStyle = this.level > 0 ? 'green' : 'red';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y - 15, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '16px Arial';
        ctx.fillText(this.name, this.x + this.width / 2, this.y + this.height / 2);
    }

    updateLevel() {
        if (this.level < this.targetLevel) {
            this.level += 1;
        }
    }
}

// Initialize tanks
const tankWidth = 150;
const tankHeight = 300;
const tank1 = new Tank(50, 50, tankWidth, tankHeight, 'Flavor 1', 100, [{ color: '#FFA500', percentage: 100 }], false); // Flavor 1
const tank2 = new Tank(250, 50, tankWidth, tankHeight, 'Flavor 2', 100, [{ color: '#FF0000', percentage: 100 }], false); // Flavor 2
const tank3 = new Tank(450, 50, tankWidth, tankHeight, 'Water', 100, [{ color: '#ADD8E6', percentage: 100 }], false); // Water

// Center the mixed tank below the others
const tank4 = new Tank(
    (canvasWidth - tankWidth) / 2, 
    (canvasHeight - tankHeight) / 2 + tankHeight,
    tankWidth,
    tankHeight,
    'Mixed',
    0,
    [], 
    true
);

// Pipe coordinates
const pipes = [
    { from: tank1, to: tank4, color: '#FFA500', flowPosition: 0 },
    { from: tank2, to: tank4, color: '#FF0000', flowPosition: 0 },
    { from: tank3, to: tank4, color: '#ADD8E6', flowPosition: 0 }
];

// Event listeners for control elements
flavor1Input.addEventListener('input', updateWaterPercentage);
flavor2Input.addEventListener('input', updateWaterPercentage);
waterInput.addEventListener('input', updateWaterPercentage);
startButton.addEventListener('click', startMixing);
stopButton.addEventListener('click', stopMixing);
resetButton.addEventListener('click', resetSimulation);

// Update water percentage and slider values
function updateWaterPercentage() {
    let flavor1Value = parseInt(flavor1Input.value) || 0;
    let flavor2Value = parseInt(flavor2Input.value) || 0;
    let waterValue = 100 - (flavor1Value + flavor2Value);
    if (waterValue < 0) {
        waterValue = 0;
        flavor1Input.value = 100 - flavor2Value;
    }
    waterInput.value = waterValue;

    // Update percentage displays
    flavor1ValueSpan.textContent = `${flavor1Value}%`;
    flavor2ValueSpan.textContent = `${flavor2Value}%`;
    waterValueSpan.textContent = `${waterValue}%`;

    mix();
}

// Start mixing process
function startMixing() {
    if (!isMixing) {
        isMixing = true;
        animate();
    }
}

// Stop mixing process
function stopMixing() {
    if (isMixing) {
        isMixing = false;
        cancelAnimationFrame(animationFrameId);
    }
}

// Reset simulation
function resetSimulation() {
    stopMixing();
    tank1.level = 0;
    tank2.level = 0;
    tank3.level = 0;
    tank4.level = 0;
    tank4.targetLevel = 0;
    tank4.colors = [];
    draw();
}

// Mix colors based on the flavors
function mix() {
    let flavor1Value = parseInt(flavor1Input.value);
    let flavor2Value = parseInt(flavor2Input.value);
    let waterValue = parseInt(waterInput.value);

    // Total percentage
    const totalValue = flavor1Value + flavor2Value + waterValue;

    // Update tank levels
    tank1.targetLevel = flavor1Value;
    tank2.targetLevel = flavor2Value;
    tank3.targetLevel = waterValue;

    if (totalValue > 0) {
        tank4.targetLevel = 100;
    } else {
        tank4.targetLevel = 0;
    }

    // Set colors for the mixed tank
    let colors = [];
    if (flavor1Value > 0) colors.push({ color: '#FFA500', percentage: flavor1Value });
    if (flavor2Value > 0) colors.push({ color: '#FF0000', percentage: flavor2Value });
    if (waterValue > 0) colors.push({ color: '#ADD8E6', percentage: waterValue });

    // Normalize percentages to sum to 100
    const totalPercentage = colors.reduce((sum, color) => sum + color.percentage, 0);
    if (totalPercentage > 0) {
        colors.forEach(color => {
            color.percentage = (color.percentage / totalPercentage) * 100;
        });
    }

    tank4.colors = colors;
}

// Draw pipes with animation
function drawPipes() {
    pipes.forEach(pipe => {
        // Draw the pipes beneath the tanks
        ctx.strokeStyle = isMixing ? 'rgba(255, 255, 0, 0.8)' : pipe.color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Pipe start point
        const fromX = pipe.from.x + pipe.from.width / 2;
        const fromY = pipe.from.y + pipe.from.height;
        // Pipe end point
        const toX = pipe.to.x + pipe.to.width / 2;
        const toY = pipe.to.y;

        // Draw straight line for pipe
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Animate liquid flow
        if (isMixing) {
            pipe.flowPosition += 5;
            if (pipe.flowPosition > Math.hypot(toX - fromX, toY - fromY)) {
                pipe.flowPosition = 0;
            }

            // Draw liquid flowing
            ctx.strokeStyle = pipe.color;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(fromX + (pipe.flowPosition * (toX - fromX) / Math.hypot(toX - fromX, toY - fromY)),
                       fromY + (pipe.flowPosition * (toY - fromY) / Math.hypot(toX - fromX, toY - fromY)));
            ctx.stroke();
        }
    });
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw tanks
    tank1.draw();
    tank2.draw();
    tank3.draw();
    tank4.draw();

    // Draw pipes
    drawPipes();
}

// Animation loop
function animate() {
    if (isMixing) {
        mix(); // Mix the colors
        tank4.updateLevel();
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Initial draw
draw();

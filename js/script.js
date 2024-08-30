// Canvas en context initialiseren
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Controle elementen selecteren
const flavor1Input = document.getElementById('flavor1');
const flavor2Input = document.getElementById('flavor2');
const waterInput = document.getElementById('water');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const resetButton = document.getElementById('resetButton');

// Simulatie variabelen
let isMixing = false;
let animationFrameId;

// Canvas afmetingen
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Tank objecten definiëren
class Tank {
    constructor(x, y, width, height, color, name, level = 0, hasWindow = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.name = name; // Naam van de tank
        this.level = level; // in percentages (0-100)
        this.targetLevel = level; // Het doelniveau voor animatie
        this.hasWindow = hasWindow;
    }

    draw() {
        // Teken de tank
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Teken de vloeistof
        const liquidHeight = (this.level / 100) * this.height;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + this.height - liquidHeight, this.width, liquidHeight);

        // Teken het kijkvenster als dat nodig is
        if (this.hasWindow) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.strokeRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
        }

        // Teken een lampje om de status aan te geven
        ctx.fillStyle = this.level > 0 ? 'green' : 'red';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y - 15, 10, 0, Math.PI * 2);
        ctx.fill();

        // Teken de naam in het midden van de tank
        ctx.fillStyle = '#000'; // Tekstkleur
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '16px Arial';
        ctx.fillText(this.name, this.x + this.width / 2, this.y + this.height / 2);
    }

    // Niveau langzaam naar doelniveau brengen
    updateLevel() {
        if (this.level < this.targetLevel) {
            this.level += 1; // Verhoog het vloeistofniveau in stappen
        }
    }
}

// Tanks initialiseren
const tankWidth = 150;
const tankHeight = 300;
const tank1 = new Tank(50, 50, tankWidth, tankHeight, 'orange', 'Flavor 1', 100); // Smaak 1
const tank2 = new Tank(250, 50, tankWidth, tankHeight, 'red', 'Flavor 2', 100);   // Smaak 2
const tank3 = new Tank(450, 50, tankWidth, tankHeight, 'lightblue', 'Water', 100); // Water

// Center de tank 4 onder de andere tanks
const tank4 = new Tank(
    (canvasWidth - tankWidth) / 2, // Horizontaal gecentreerd
    (canvasHeight - tankHeight) / 2 + tankHeight, // Direct onder de andere tanks
    tankWidth,
    tankHeight,
    'yellow',
    'Mixed',
    0,
    true
);

// Pijpen coördinaten definiëren
const pipes = [
    { from: tank1, to: tank4, color: 'orange', flowPosition: 0 },
    { from: tank2, to: tank4, color: 'red', flowPosition: 0 },
    { from: tank3, to: tank4, color: 'lightblue', flowPosition: 0 }
];

// Event listeners voor controle elementen
flavor1Input.addEventListener('input', updateWaterPercentage);
flavor2Input.addEventListener('input', updateWaterPercentage);
startButton.addEventListener('click', startMixing);
stopButton.addEventListener('click', stopMixing);
resetButton.addEventListener('click', resetSimulation);

// Water percentage bijwerken op basis van de andere smaken
function updateWaterPercentage() {
    let flavor1Value = parseInt(flavor1Input.value) || 0;
    let flavor2Value = parseInt(flavor2Input.value) || 0;
    let waterValue = 100 - (flavor1Value + flavor2Value);
    if (waterValue < 0) {
        waterValue = 0;
        flavor1Input.value = 100 - flavor2Value;
    }
    waterInput.value = waterValue;
}

// Start het mengproces
function startMixing() {
    if (!isMixing) {
        isMixing = true;
        animate();
    }
}

// Stop het mengproces
function stopMixing() {
    if (isMixing) {
        isMixing = false;
        cancelAnimationFrame(animationFrameId);
    }
}

// Reset de simulatie
function resetSimulation() {
    stopMixing();
    tank4.level = 0;
    tank4.targetLevel = 0;
    draw();
}

// Kleur mengen
function mixColors(colors) {
    let r = 0, g = 0, b = 0;

    colors.forEach(color => {
        const [colorR, colorG, colorB] = hexToRgb(color);
        r += colorR;
        g += colorG;
        b += colorB;
    });

    r = Math.round(r / colors.length);
    g = Math.round(g / colors.length);
    b = Math.round(b / colors.length);

    return `rgb(${r}, ${g}, ${b})`;
}

// Hex naar RGB converteren
function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;

    // 3 hex getallen
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);

    // 6 hex getallen
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }

    return [r, g, b];
}

// Het mengproces simuleren
function mix() {
    let flavor1Value = parseInt(flavor1Input.value);
    let flavor2Value = parseInt(flavor2Input.value);
    let waterValue = parseInt(waterInput.value);

    let totalValue = flavor1Value + flavor2Value + waterValue;
    if (totalValue > 100) {
        totalValue = 100;
    }
    
    // Stel het doelniveau in voor de mengtank
    tank4.targetLevel = totalValue; // Het doel is nu het totaal van de percentages

    // Meng de kleuren op basis van de vloeistoffen
    let colors = [];
    if (flavor1Value > 0) colors.push('#FFA500'); // Orange
    if (flavor2Value > 0) colors.push('#FF0000'); // Red
    if (waterValue > 0) colors.push('#ADD8E6'); // Lightblue
    
    tank4.color = mixColors(colors);
}

// Pijpen tekenen met animatie
function drawPipes() {
    pipes.forEach(pipe => {
        // Teken de pijpen onder de tanks
        ctx.strokeStyle = isMixing ? 'rgba(255, 255, 0, 0.8)' : pipe.color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Beginpunt van de pijp
        const fromX = pipe.from.x + pipe.from.width / 2;
        const fromY = pipe.from.y + pipe.from.height;
        // Eindpunt van de pijp
        const toX = pipe.to.x + pipe.to.width / 2;
        const toY = pipe.to.y;

        // Teken rechte lijn voor pijp
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Vloeistofstroom animeren
        if (isMixing) {
            pipe.flowPosition += 5;
            if (pipe.flowPosition > Math.hypot(toX - fromX, toY - fromY)) {
                pipe.flowPosition = 0;
            }

            // Teken bewegende stipjes voor vloeistofstroom
            ctx.fillStyle = pipe.color;
            const flowProgress = pipe.flowPosition;
            ctx.beginPath();
            ctx.arc(fromX + (toX - fromX) * flowProgress / Math.hypot(toX - fromX, toY - fromY), 
                    fromY - (fromY - toY) * flowProgress / Math.hypot(toX - fromX, toY - fromY), 
                    5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Hoofd tekenfunctie
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Eerst de pijpen tekenen
    drawPipes();

    // Daarna de tanks tekenen zodat ze bovenop de pijpen liggen
    tank1.draw();
    tank2.draw();
    tank3.draw();
    
    // Teken tank 4 als laatste zodat deze onder de andere tanks blijft
    tank4.updateLevel(); // Niveau bijwerken voordat de tank wordt getekend
    tank4.draw();
}

// Animatiefunctie
function animate() {
    if (isMixing) {
        mix();
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Initiële weergave
updateWaterPercentage();
draw();

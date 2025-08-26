
const canvas = document.getElementById("canvas");
canvas.height = window.innerHeight;
canvas.width = 200;


const networkCanvas = document.getElementById("netwrkCanvas");
networkCanvas.height = window.innerHeight;
networkCanvas.width = 300;

const networkCtx = networkCanvas.getContext("2d");
const ctx = canvas.getContext("2d");

const road=new Road(canvas.width/2, canvas.width*0.9);
// const car = new Car(road.getLaneCenter(1), 100, 30, 50, 'AI');
let controlType = 'AI'; // Changed to AI for neural network cars
const cars = generateCars(100);
let bestCar = cars[0];
if(localStorage.getItem('bestBrain')){
    for(let i = 0; i < cars.length; i++){
        cars[i].brain = JSON.parse(localStorage.getItem('bestBrain'));

        if(i != 0){
            NeuralNetwork.mutate(cars[i].brain, 0.1);
        }
    }
}

// Initialize the traffic manager for infinite car generation
const trafficManager = new TrafficManager(road);
function generateCars(N){
    const cars = [];
    for(let i = 0; i < N; i++){
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, controlType));
    }
    return cars;
}

function save(){
    localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem('bestBrain');
}

function toggleMode() {
    // Toggle between AI and KEYS mode
    if (controlType === 'AI') {
        controlType = 'KEYS';
        document.getElementById('mode-toggle').textContent = 'Switch to AI';
        document.getElementById('current-mode').textContent = 'Manual';
        // Hide the neural network visualizer
        document.getElementById('netwrkCanvas').classList.add('hidden');
    } else {
        controlType = 'AI';
        document.getElementById('mode-toggle').textContent = 'Switch to Manual';
        document.getElementById('current-mode').textContent = 'AI';
        // Show the neural network visualizer
        document.getElementById('netwrkCanvas').classList.remove('hidden');
    }
    
    // Regenerate cars with new control type
    regenerateCars();
}

function regenerateCars() {
    // Generate new cars with the current control type
    const newCars = generateCars(controlType === 'KEYS' ? 1 : 100);
    
    // If switching to AI mode and we have a saved brain, apply it
    if (controlType === 'AI' && localStorage.getItem('bestBrain')) {
        for(let i = 0; i < newCars.length; i++){
            newCars[i].brain = JSON.parse(localStorage.getItem('bestBrain'));
            if(i != 0){
                NeuralNetwork.mutate(newCars[i].brain, 0.1);
            }
        }
    }
    
    // Replace the global cars array
    cars.length = 0; // Clear existing cars
    cars.push(...newCars); // Add new cars
    bestCar = cars[0];
    
    // Debug: Check traffic manager state after mode switch
    console.log(`Switched to ${controlType} mode with ${cars.length} cars`);
    console.log(`Traffic manager has ${trafficManager.getCarCount()} traffic cars`);
    
    // Always reset traffic when switching modes to ensure fresh traffic
    console.log('Resetting traffic for mode switch...');
    trafficManager.resetTraffic();
}


function animate(time){
    // Find the best performing car
    bestCar = cars.find(c => c.y == Math.min(...cars.map(c => c.y)));
    
    // Update traffic manager with player position
    trafficManager.update(bestCar.y);
    
    // Get current traffic cars
    const traffic = trafficManager.getCars();
    
    // Debug: Log traffic info occasionally, more frequently in manual mode
    const debugChance = controlType === 'KEYS' ? 0.05 : 0.01; // 5% in manual, 1% in AI
    if (Math.random() < debugChance) {
        console.log(`Mode: ${controlType}, Player Y: ${bestCar.y.toFixed(1)}, Traffic cars: ${traffic.length}`);
        if (traffic.length > 0) {
            console.log('Traffic Y positions:', traffic.slice(0, 3).map(car => car.y.toFixed(1)));
        } else {
            console.log('No traffic cars found! Checking traffic manager state...');
            console.log('Traffic manager car count:', trafficManager.getCarCount());
        }
    }

    // Update AI cars with current traffic
    for(let i = 0; i < cars.length; i++){
        cars[i].update(road.borders, traffic);
    }

    // Render everything
    canvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    ctx.save();
    ctx.translate(0, -bestCar.y + canvas.height*0.7);
    road.draw(ctx);
    
    // Draw traffic cars
    trafficManager.draw(ctx);
    
    // Draw AI cars with transparency
    ctx.globalAlpha = 0.2;
    for(let i = 0; i < cars.length; i++){
        cars[i].draw(ctx);
    }
    
    // Draw best car highlighted
    ctx.globalAlpha = 1;
    bestCar.draw(ctx, true);

    ctx.restore();

    // Draw neural network visualization only in AI mode
    if (controlType === 'AI' && bestCar.brain) {
        networkCtx.lineDashOffset = -time/50;
        Visualizer.drawNetwork(networkCtx, bestCar.brain);
    }
    
    // Update debug info
    // document.getElementById('car-count').textContent = trafficManager.getCarCount();
    
    requestAnimationFrame(animate);
}

animate();
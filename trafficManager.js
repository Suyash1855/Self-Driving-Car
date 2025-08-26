class TrafficManager {
    constructor(road) {
        this.road = road;
        this.cars = [];
        this.spawnDistance = 500; // Distance ahead to spawn new cars
        this.cleanupDistance = 500; // Distance behind to remove cars
        this.minCarSpacing = 200; // Minimum distance between cars
        this.maxCarSpacing = 500; // Maximum distance between cars
        this.lastSpawnY = -100; // Y position of the last spawned car
        this.dummyCarSpeed = 4; // Constant speed for all dummy cars
        
        // Initialize with some starting cars
        this.initializeTraffic();
    }
    
    initializeTraffic() {
        // Create initial traffic cars ensuring passable lanes
        this.cars = [];
        
        // Create several clusters with guaranteed free lanes
        const initialClusters = [
            { y: -200, freeLane: 1, cars: [0, 2] },      // Free middle lane
            { y: -500, freeLane: 0, cars: [1, 2] },      // Free left lane  
            { y: -800, freeLane: 2, cars: [0, 1] },      // Free right lane
            { y: -1100, freeLane: 1, cars: [0] },        // Free middle lane, only one car
        ];
        
        for (const cluster of initialClusters) {
            for (const lane of cluster.cars) {
                const yVariation = (Math.random() - 0.5) * 50; // Smaller variation for initial cars
                const carY = cluster.y + yVariation;
                
                const newCar = new Car(
                    this.road.getLaneCenter(lane),
                    carY,
                    30,
                    50,
                    'DUMMY',
                    this.dummyCarSpeed,
                    getRandomColor()
                );
                
                this.cars.push(newCar);
            }
        }
        
        this.lastSpawnY = Math.min(...this.cars.map(car => car.y));
        
        console.log('TrafficManager initialized with', this.cars.length, 'cars');
        console.log('Initial cars Y positions:', this.cars.map(car => car.y));
        console.log('All clusters have guaranteed free lanes for passing');
    }
    
    update(playerY) {
        // Remove cars that are too far behind the player
        this.cleanupOldCars(playerY);
        
        // Spawn new cars ahead of the player
        this.spawnNewCars(playerY);
        
        // Update all traffic cars
        for (let i = 0; i < this.cars.length; i++) {
            this.cars[i].update(this.road.borders, []);
        }
    }
    
    cleanupOldCars(playerY) {
        // Remove cars that are too far behind the player
        // Since we move in negative Y direction, cars behind have HIGHER Y values
        const initialCount = this.cars.length;
        this.cars = this.cars.filter(car => car.y < playerY + this.cleanupDistance);
        const removedCount = initialCount - this.cars.length;
        
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} cars. Player Y: ${playerY}, Remaining cars: ${this.cars.length}`);
        }
    }
    
    spawnNewCars(playerY) {
        // Spawn new cars if the player is getting close to the last spawned car
        const spawnThreshold = playerY - this.spawnDistance;
        
        while (this.lastSpawnY > spawnThreshold) {
            this.spawnCarCluster();
        }
    }
    
    spawnCarCluster() {
        // Generate a cluster ensuring at least one lane is always free
        // Maximum cars = total lanes - 1 (to guarantee one free lane)
        const maxCarsInCluster = Math.max(1, this.road.laneCount - 1);
        const numCars = Math.floor(Math.random() * maxCarsInCluster) + 1;
        const spacing = this.minCarSpacing + Math.random() * (this.maxCarSpacing - this.minCarSpacing);
        
        // Move spawn position forward
        this.lastSpawnY -= spacing;
        
        // Ensure at least one lane remains free
        const allLanes = Array.from({length: this.road.laneCount}, (_, i) => i);
        const freeLane = allLanes[Math.floor(Math.random() * allLanes.length)];
        const availableLanes = allLanes.filter(lane => lane !== freeLane);
        
        // Shuffle available lanes for random selection
        for (let i = availableLanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableLanes[i], availableLanes[j]] = [availableLanes[j], availableLanes[i]];
        }
        
        // Create cars in available lanes (excluding the guaranteed free lane)
        const carsToSpawn = Math.min(numCars, availableLanes.length);
        
        for (let i = 0; i < carsToSpawn; i++) {
            const lane = availableLanes[i];
            
            // Add some vertical variation within the cluster
            const yVariation = (Math.random() - 0.5) * 100;
            const carY = this.lastSpawnY + yVariation;
            
            // Use constant speed for all dummy cars
            const newCar = new Car(
                this.road.getLaneCenter(lane),
                carY,
                30,
                50,
                'DUMMY',
                this.dummyCarSpeed,
                getRandomColor()
            );
            
            this.cars.push(newCar);
        }
        
        // Debug log to verify lane distribution
        if (Math.random() < 0.1) { // 10% chance
            const spawnedLanes = availableLanes.slice(0, carsToSpawn);
            console.log(`Spawned ${carsToSpawn} cars in lanes [${spawnedLanes.join(', ')}], free lane: ${freeLane}`);
        }
    }
    
    draw(ctx) {
        // Draw all traffic cars
        for (let i = 0; i < this.cars.length; i++) {
            this.cars[i].draw(ctx);
        }
    }
    
    getCars() {
        return this.cars;
    }
    
    getCarCount() {
        return this.cars.length;
    }
    
    resetTraffic() {
        // Reset traffic manager to initial state
        console.log('Resetting traffic manager...');
        this.cars = [];
        this.lastSpawnY = -100;
        this.initializeTraffic();
        console.log(`Traffic reset complete. ${this.cars.length} cars initialized.`);
    }
}

// Parameters
const target = "Hello, World!";
const mutationRate = 0.01;
const populationSize = 200;
const genes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ,.!";

// Helper function to generate a random character
function randomChar() {
    return genes[Math.floor(Math.random() * genes.length)];
}

// Individual class
class Individual {
    constructor(chromosome) {
        if (chromosome) this.chromosome = chromosome;
        else {
            this.chromosome = "";
            for (let i = 0; i < target.length; i++) {
                this.chromosome += randomChar();
            }
        }
    }

    // Fitness function
    evaluateFitness() {
        let fitness = 0;
        for (let i = 0; i < this.chromosome.length; i++) {
            if (this.chromosome[i] === target[i]) fitness++;
        }
        return fitness;
    }

    // Crossover
    crossover(partner) {
        const childChromosome = [];
        const midpoint = Math.floor(Math.random() * this.chromosome.length);
        for (let i = 0; i < this.chromosome.length; i++) {
            if (i > midpoint) childChromosome[i] = this.chromosome[i];
            else childChromosome[i] = partner.chromosome[i];
        }
        return new Individual(childChromosome.join(''));
    }

    // Mutation
    mutate() {
        let mutatedChromosome = "";
        for (let i = 0; i < this.chromosome.length; i++) {
            if (Math.random() < mutationRate) mutatedChromosome += randomChar();
            else mutatedChromosome += this.chromosome[i];
        }
        this.chromosome = mutatedChromosome;
    }
}

// Population
class Population {
    constructor(size) {
        this.individuals = [];
        for (let i = 0; i < size; i++) {
            this.individuals.push(new Individual());
        }
    }

    // Evaluate the entire population
    evaluateFitness() {
        this.individuals.forEach(individual => individual.fitness = individual.evaluateFitness());
    }

    // Select parents
    selectParents() {
        // Implement a selection method, such as tournament selection or roulette wheel selection
        // For simplicity, we'll use a basic "tournament" selection
        let winner = new Individual();
        for (let i = 0; i < 2; i++) {
            let randomId = Math.floor(Math.random() * this.individuals.length);
            if (this.individuals[randomId].fitness > winner.fitness) {
                winner = this.individuals[randomId];
            }
        }
        return winner;
    }

    // Generate a new generation
    generate() {
        const newIndividuals = [];
        for (let i = 0; i < this.individuals.length; i++) {
            const parentA = this.selectParents();
            const parentB = this.selectParents();
            let child = parentA.crossover(parentB);
            child.mutate();
            newIndividuals.push(child);
        }
        this.individuals = newIndividuals;
    }

    // Find the fittest individual
    getFittest() {
        return this.individuals.reduce((prev, current) => (prev.fitness > current.fitness) ? prev : current);
    }
}

// Main loop
function main() {
    let population = new Population(populationSize);
    let generation = 0;
    let fittest = population.getFittest();

    while (fittest.fitness < target.length) {
        generation++;
        console.log(`Generation: ${generation} Fittest: ${fittest.chromosome} Fitness: ${fittest.fitness}`);
        population.evaluateFitness();
        population.generate();
        fittest = population.getFittest();
    }

    console.log(`Solution found at generation ${generation} with fitness ${fittest.fitness}: ${fittest.chromosome}`);
}

main();

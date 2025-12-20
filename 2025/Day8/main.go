package main

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"reflect"
	"slices"
	"sort"
	"strconv"
	"strings"
)

// Number of junction pair to connect (the closed ones)
const PAIR_TO_CONNECT = 1000

// A junction is represented by its 3D coordinate
type Junction struct {
	X int
	Y int
	Z int
}

// Distance between two pairs of junction
type DistanceForJunctionPair struct {
	A        Junction
	B        Junction
	Distance float64
}

// The set of junction connected to this junction (include the junction itself in its set)
type JunctionNetwork map[Junction]map[Junction]bool

// Get unique ID for a map instance
func getMapID(m map[Junction]bool) uintptr {
	return reflect.ValueOf(m).Pointer()
}

// Read the coordonnates from the file and create a list of junctions
func getJunctionsFromFile(fileName string) ([]Junction, error) {
	// Open the file
	file, err := os.Open(fileName)
	if err != nil {
		return nil, err
	}
	defer file.Close() // Ensure file is closed when function exits

	// Create a scanner to read line by line
	scanner := bufio.NewScanner(file)

	// Create the map
	result := []Junction{}

	// Read each line
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, ",")
		if len(parts) != 3 {
			return nil, fmt.Errorf("Unable to parse line \"%s\"", line)
		}
		// Make Coord3D
		junction := Junction{}
		for index, stringCoordinate := range parts {
			coordinate, err := strconv.Atoi(stringCoordinate) // Atoi = ASCII to integer
			if err != nil {
				return nil, fmt.Errorf("Unable to parse string coordonnate \"%s\"", stringCoordinate)
			}
			switch index {
			case 0:
				junction.X = coordinate
			case 1:
				junction.Y = coordinate
			case 2:
				junction.Z = coordinate
			}
		}
		result = append(result, junction)
	}

	// Check for errors during scanning
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

// Finding the nearest junctions by pairing all of them and measuring their distance to each other.
// Adding them to the resulting sorted slice.
func findNerestJunctions(junctions []Junction) []DistanceForJunctionPair {
	result := []DistanceForJunctionPair{}

	processNewJunctionPair := func(junctionA, junctionB Junction) {
		// Calculate a distance between two junctions
		computeStraightLineDistance := func() float64 {
			return math.Sqrt(math.Pow((float64)(junctionA.X-junctionB.X), 2) + math.Pow((float64)(junctionA.Y-junctionB.Y), 2) + math.Pow((float64)(junctionA.Z-junctionB.Z), 2))
		}

		distance := computeStraightLineDistance()
		index := sort.Search(len(result), func(i int) bool {
			return result[i].Distance > distance
		})
		if index < PAIR_TO_CONNECT {
			result = slices.Insert(result, index, DistanceForJunctionPair{junctionA, junctionB, distance})
			if len(result) > PAIR_TO_CONNECT {
				result = result[:PAIR_TO_CONNECT] // Keep only first PAIR_TO_CONNECT
			}
		}
	}

	alreadyProcessedJunction := make(map[Junction]bool)
	for _, junctionA := range junctions {
		for _, junctionB := range junctions {
			if _, exists := alreadyProcessedJunction[junctionB]; !exists && junctionA != junctionB {
				processNewJunctionPair(junctionA, junctionB)
			}
		}
		alreadyProcessedJunction[junctionA] = true
	}
	return result
}

// Create the junction network where each junction is associated to its network.
func createJunctionNetwork(junctions []Junction, distanceForJunctionPairs []DistanceForJunctionPair) JunctionNetwork {

	// Create the initial network where each junction is simply connected to itself
	createInitialJunctionNetwork := func() JunctionNetwork {
		result := make(JunctionNetwork)
		for _, junction := range junctions {
			result[junction] = make(map[Junction]bool)
			result[junction][junction] = true
		}
		return result
	}

	junctionNetwork := createInitialJunctionNetwork()

	// Link two junction together
	linkJunctions := func(a, b Junction) {
		junctionNetworkA := junctionNetwork[a]
		junctionNetworkB := junctionNetwork[b]

		// Merge b's network into a's network
		for junction := range junctionNetworkB {
			junctionNetworkA[junction] = true
		}

		// Update all junctions that were using b's old map to use a's map
		junctionBMapID := getMapID(junctionNetworkB)
		for junction, network := range junctionNetwork {
			if getMapID(network) == junctionBMapID {
				junctionNetwork[junction] = junctionNetworkA
			}
		}
	}

	// Merge the nearest junctions we found previously
	for _, distanceForJunctionPair := range distanceForJunctionPairs {
		linkJunctions(distanceForJunctionPair.A, distanceForJunctionPair.B)
	}

	return junctionNetwork
}

// Found the three large circuits of junctions
func computeSizeOfThreeLargestCircuits(junctionNetwork JunctionNetwork) []int {
	result := []int{}

	// Avoid processing the junction having the same netnwork (having the same set)
	alreadyProcessedJunctionSet := make(map[uintptr]bool)

	for _, junctions := range junctionNetwork {
		junctionsMapID := getMapID(junctions)
		if _, exists := alreadyProcessedJunctionSet[junctionsMapID]; exists {
			continue
		}
		junctionCount := len(junctions)
		index := sort.Search(len(result), func(i int) bool {
			return result[i] <= junctionCount
		})
		if index < 3 {
			result = slices.Insert(result, index, junctionCount)
			if len(result) > 3 {
				result = result[:3]
			}
		}
		alreadyProcessedJunctionSet[junctionsMapID] = true
	}
	return result
}

func main() {
	junctions, err := getJunctionsFromFile("input")
	if err != nil {
		fmt.Println("Process aborted due to error:", err)
		os.Exit(1)
	}
	distanceForJunctionPairs := findNerestJunctions(junctions)

	junctionNetwork := createJunctionNetwork(junctions, distanceForJunctionPairs)

	threeLargestCircuit := computeSizeOfThreeLargestCircuits(junctionNetwork)

	fmt.Printf("Multiply together, the sizes of the three largest circuits is: %d\n", threeLargestCircuit[0]*threeLargestCircuit[1]*threeLargestCircuit[2])
}

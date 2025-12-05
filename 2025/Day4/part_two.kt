// Advent of Code 2025, day 4, part two

import kotlin.system.exitProcess
import kotlin.plus 
import java.io.File


fun main() {
    val rollCountProcessor = RollCounter2()
    rollCountProcessor.processFile(file=java.io.File("input"))
    println("Number of accessible roll: ${rollCountProcessor.rollAvailable}")    
}

class RollCounter2(var rollAvailable: Int = 0) {
    val ROLL_CHAR = '@'
    val MAXIMUM_ADJACENT_ROLL = 3

    private var lines = ArrayList<String>()

    fun processFile(file: File) {
        lines = ArrayList(file.readLines())
        
        while(true) {
            var previousRollAvailable = rollAvailable
            
            for(lineIndex in 0..<lines.size) {
                rollAvailable += getAccessibleRollInLine(lineIndex)
            }

            if (previousRollAvailable == rollAvailable) {
                break
            }        
        }
    }

    private fun getAccessibleRollInLine(lineIndex: Int): Int {
        var stringLine: String = lines[lineIndex]
        var accessibleRollInLine = 0
        for(charIndex in 0..<stringLine.length) {
            if (stringLine[charIndex] != ROLL_CHAR) {
                continue
            }
            var rollCount = 0
            lineLoop@ for(line in if (lineIndex > 0) { -1 } else { 0 } .. if (lines.size - 1 > lineIndex) { 1 } else { 0 } ) {
                for(column in if (charIndex > 0) { -1 } else { 0 } .. if (stringLine.length - 1 > charIndex) { 1 } else { 0 }) {
                    if (line == 0 && column == 0) {
                        continue
                    }
                    if (lines[lineIndex + line][charIndex + column] == ROLL_CHAR) {
                        ++rollCount
                        if (rollCount > MAXIMUM_ADJACENT_ROLL) {
                            break@lineLoop
                        }
                    }
                }
            }
            if (rollCount <= MAXIMUM_ADJACENT_ROLL) {
                ++accessibleRollInLine

                stringLine = stringLine.substring(0, charIndex) + "." + stringLine.substring(charIndex + 1)
                lines.set(lineIndex, stringLine)
            }
        }
        return accessibleRollInLine
    }
}

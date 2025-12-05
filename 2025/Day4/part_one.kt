// Advent of Code 2025, day 4, part one

import kotlin.system.exitProcess
import kotlin.plus 
import java.io.File


const val ROLL_CHAR = '@'
const val MAXIMUM_ADJACENT_ROLL = 3

fun main() {
    val rollCountProcessor = RollCounter()
    rollCountProcessor.processFile(file=java.io.File("input"))
    println("Number of accessible roll: ${rollCountProcessor.rollAvailable}")    
}

class RollCounter(var rollAvailable: Int = 0) {
    private val buffer: ArrayDeque<String> = ArrayDeque()

    fun processFile(file: File) {
        buffer.clear()
        val lines: List<String> = file.readLines()
        val firstLine: String? = lines.first()
        if (firstLine == null) {
            return
        }
        buffer.addLast(firstLine)
        val secondLine: String? = lines.getOrNull(1)
        if (secondLine != null) {
            buffer.addLast(secondLine)
        }
        rollAvailable += getAccessibleRollInLine(lineIndex=0)
        if (secondLine == null) {
            return
        }

        var lineIndex = 2
        while(true) {
            val newLine: String? = lines.getOrNull(lineIndex++)
            if (newLine != null) {
                buffer.addLast(newLine)
            }
            rollAvailable += getAccessibleRollInLine(lineIndex=1)
            if (newLine == null) {
                return
            }
            buffer.removeFirst()
        }        
    }

    private fun getAccessibleRollInLine(lineIndex: Int): Int {
        val stringLine: String = buffer[lineIndex]
        var accessibleRollInLine = 0
        for(charIndex in 0..<stringLine.length) {
            if (stringLine[charIndex] != ROLL_CHAR) {
                continue
            }
            var rollCount = 0
            lineLoop@ for(line in if (lineIndex > 0) { -1 } else { 0 } .. if (buffer.size - 1 > lineIndex) { 1 } else { 0 } ) {
                for(column in if (charIndex > 0) { -1 } else { 0 } .. if (stringLine.length - 1 > charIndex) { 1 } else { 0 }) {
                    if (line == 0 && column == 0) {
                        continue
                    }
                    if (buffer[lineIndex + line][charIndex + column] == ROLL_CHAR) {
                        ++rollCount
                        if (rollCount > MAXIMUM_ADJACENT_ROLL) {
                            break@lineLoop
                        }
                    }
                }
            }
            if (rollCount <= MAXIMUM_ADJACENT_ROLL) {
                ++accessibleRollInLine
            }
        }
        return accessibleRollInLine
    }
}

package com.rea.games.runner

enum class ObstacleType {
    HURDLE,       // Jumpable barrier (low height)
    HIGH_BARRIER, // Slideable barrier (overhead height)
    TRAIN_BLOCK   // Solid block (must switch lanes)
}

data class Obstacle(
    val lane: Int,              // -1, 0, 1
    var z: Float,               // Distance ahead of player
    val type: ObstacleType,
    val width: Float = 0.8f,
    val height: Float = when (type) {
        ObstacleType.HURDLE -> 0.7f
        ObstacleType.HIGH_BARRIER -> 1.8f
        ObstacleType.TRAIN_BLOCK -> 2.4f
    },
    val bottomOffset: Float = when (type) {
        ObstacleType.HURDLE -> 0f
        ObstacleType.HIGH_BARRIER -> 0.8f // Gap at bottom to slide under
        ObstacleType.TRAIN_BLOCK -> 0f
    }
)

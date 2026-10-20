package com.rea.games.runner

import kotlin.math.abs

object CollisionSystem {

    private const val COLLISION_Z_THRESHOLD = 0.6f
    private const val LANE_TOLERANCE = 0.45f

    /**
     * Checks if player collides with an obstacle.
     * Returns true if there is a fatal collision (game over).
     */
    fun checkObstacleCollision(player: Player, obstacle: Obstacle): Boolean {
        // Z distance check
        if (abs(obstacle.z) > COLLISION_Z_THRESHOLD) {
            return false
        }

        // X (Lane) check
        if (abs(player.currentX - obstacle.lane) > LANE_TOLERANCE) {
            return false
        }

        // Vertical collision check based on obstacle type
        return when (obstacle.type) {
            ObstacleType.HURDLE -> {
                // Low hurdle: jumping over avoids it (player.y must be > hurdle height)
                player.y < obstacle.height
            }
            ObstacleType.HIGH_BARRIER -> {
                // High barrier: sliding under avoids it (must be sliding or crouched under the bottom offset)
                val playerTop = player.y + player.getEffectiveHeight()
                playerTop > obstacle.bottomOffset
            }
            ObstacleType.TRAIN_BLOCK -> {
                // Train / Solid wall: fatal if in the same lane
                true
            }
        }
    }

    /**
     * Checks if player collects a coin.
     */
    fun checkCoinPickup(player: Player, coin: Coin): Boolean {
        if (coin.collected) return false
        if (abs(coin.z) > 0.8f) return false
        if (abs(player.currentX - coin.lane) > LANE_TOLERANCE) return false
        
        // Vertical reach check
        val playerBottom = player.y
        val playerTop = player.y + player.getEffectiveHeight()
        return coin.y in (playerBottom - 0.3f)..(playerTop + 0.3f)
    }
}

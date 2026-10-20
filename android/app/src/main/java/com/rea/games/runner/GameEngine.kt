package com.rea.games.runner

import java.util.concurrent.CopyOnWriteArrayList
import kotlin.random.Random

enum class GameState {
    START,
    PLAYING,
    GAME_OVER
}

class GameEngine {
    var state: GameState = GameState.START
    val player = Player()

    val obstacles = CopyOnWriteArrayList<Obstacle>()
    val coins = CopyOnWriteArrayList<Coin>()

    var distance: Float = 0f
    var coinCount: Int = 0
    var highScore: Int = 0

    var currentSpeed: Float = BASE_SPEED
    private var nextSpawnZ: Float = 30f

    companion object {
        const val BASE_SPEED = 16f
        const val MAX_SPEED = 38f
        const val ACCELERATION_RATE = 0.35f // Speed increase per second
        const val DESPAWN_Z = -5f
        const val SPAWN_DISTANCE_INTERVAL = 14f
    }

    fun start() {
        reset()
        state = GameState.PLAYING
    }

    fun restart() {
        reset()
        state = GameState.PLAYING
    }

    fun reset() {
        player.reset()
        obstacles.clear()
        coins.clear()
        distance = 0f
        coinCount = 0
        currentSpeed = BASE_SPEED
        nextSpawnZ = 25f
    }

    fun getScore(): Int {
        return distance.toInt() + coinCount * 50
    }

    fun update(dt: Float) {
        if (state != GameState.PLAYING) return

        // Speed ramp-up (difficulty scaling)
        if (currentSpeed < MAX_SPEED) {
            currentSpeed += ACCELERATION_RATE * dt
        }

        val travelDistance = currentSpeed * dt
        distance += travelDistance

        player.update(dt)

        // Move obstacles towards camera
        val obstacleIterator = obstacles.iterator()
        while (obstacleIterator.hasNext()) {
            val obs = obstacleIterator.next()
            obs.z -= travelDistance

            // Collision check
            if (CollisionSystem.checkObstacleCollision(player, obs)) {
                state = GameState.GAME_OVER
                val finalScore = getScore()
                if (finalScore > highScore) {
                    highScore = finalScore
                }
                return
            }

            // Despawn
            if (obs.z < DESPAWN_Z) {
                obstacles.remove(obs)
            }
        }

        // Move and update coins
        val coinIterator = coins.iterator()
        while (coinIterator.hasNext()) {
            val coin = coinIterator.next()
            coin.z -= travelDistance
            coin.update(dt)

            if (!coin.collected && CollisionSystem.checkCoinPickup(player, coin)) {
                coin.collected = true
                coinCount += 1
            }

            if (coin.z < DESPAWN_Z) {
                coins.remove(coin)
            }
        }

        // Spawn new patterns ahead
        spawnPatterns()
    }

    private fun spawnPatterns() {
        val maxLookahead = 90f
        val furthestZ = obstacles.maxOfOrNull { it.z } ?: 0f

        if (furthestZ < maxLookahead) {
            val spawnZ = (furthestZ + SPAWN_DISTANCE_INTERVAL).coerceAtLeast(nextSpawnZ)
            nextSpawnZ = spawnZ + SPAWN_DISTANCE_INTERVAL

            // Ensure solvability: random 1 or 2 lanes occupied, at least 1 lane completely free
            val openLane = Random.nextInt(-1, 2)
            val occupiedLanes = listOf(-1, 0, 1).filter { it != openLane }

            for (lane in occupiedLanes) {
                if (Random.nextFloat() > 0.35f) {
                    val obsType = when (Random.nextInt(3)) {
                        0 -> ObstacleType.HURDLE
                        1 -> ObstacleType.HIGH_BARRIER
                        else -> ObstacleType.TRAIN_BLOCK
                    }
                    obstacles.add(Obstacle(lane = lane, z = spawnZ, type = obsType))
                }
            }

            // Spawn coin trail in the open lane or jumping lane
            val coinLane = if (Random.nextBoolean()) openLane else Random.nextInt(-1, 2)
            for (i in 0..3) {
                coins.add(Coin(lane = coinLane, z = spawnZ + i * 2.2f))
            }
        }
    }
}

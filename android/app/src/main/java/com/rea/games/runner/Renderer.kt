package com.rea.games.runner

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF

class Renderer {

    private val skyPaint = Paint().apply { color = Color.parseColor("#1A1E29") }
    private val groundPaint = Paint().apply { color = Color.parseColor("#12141C") }
    private val trackBedPaint = Paint().apply { color = Color.parseColor("#2C3A47") }
    private val railPaint = Paint().apply {
        color = Color.parseColor("#718093")
        strokeWidth = 4f
        style = Paint.Style.STROKE
    }
    private val tiePaint = Paint().apply {
        color = Color.parseColor("#4B4B4B")
        style = Paint.Style.FILL
    }
    private val shadowPaint = Paint().apply {
        color = Color.argb(120, 0, 0, 0)
        style = Paint.Style.FILL
    }

    private val hurdlePaint = Paint().apply { color = Color.parseColor("#E84118") }
    private val barrierPaint = Paint().apply { color = Color.parseColor("#F39C12") }
    private val trainPaint = Paint().apply { color = Color.parseColor("#8C7AE6") }
    private val headlightPaint = Paint().apply { color = Color.parseColor("#F5CD79") }

    private val coinPaint = Paint().apply { color = Color.parseColor("#F1C40F") }
    private val coinInnerPaint = Paint().apply { color = Color.parseColor("#F39C12") }

    private val playerBodyPaint = Paint().apply { color = Color.parseColor("#00A8FF") }
    private val playerShirtPaint = Paint().apply { color = Color.parseColor("#E84118") }
    private val playerHeadPaint = Paint().apply { color = Color.parseColor("#F8C291") }

    private val textPaint = Paint().apply {
        color = Color.WHITE
        textSize = 48f
        isAntiAlias = true
        isFakeBoldText = true
    }

    private val overlayPaint = Paint().apply {
        color = Color.argb(190, 0, 0, 0)
    }

    fun render(canvas: Canvas, engine: GameEngine, width: Int, height: Int) {
        val horizonY = height * 0.42f
        val vanishingX = width * 0.5f

        // 1. Background
        canvas.drawRect(0f, 0f, width.toFloat(), horizonY, skyPaint)
        canvas.drawRect(0f, horizonY, width.toFloat(), height.toFloat(), groundPaint)

        // 2. Track Bed & Perspective Rails
        drawTracks(canvas, width, height, horizonY, vanishingX, engine.distance)

        // 3. Coins (Sort by distance Z descending so further objects draw first)
        val sortedCoins = engine.coins.filter { !it.collected }.sortedByDescending { it.z }
        val sortedObstacles = engine.obstacles.sortedByDescending { it.z }

        // Interleave rendering by Z
        var coinIdx = 0
        var obsIdx = 0

        while (coinIdx < sortedCoins.size || obsIdx < sortedObstacles.size) {
            val nextCoinZ = if (coinIdx < sortedCoins.size) sortedCoins[coinIdx].z else -100f
            val nextObsZ = if (obsIdx < sortedObstacles.size) sortedObstacles[obsIdx].z else -100f

            if (nextCoinZ >= nextObsZ && coinIdx < sortedCoins.size) {
                drawCoin(canvas, sortedCoins[coinIdx], width, height, horizonY, vanishingX)
                coinIdx++
            } else if (obsIdx < sortedObstacles.size) {
                drawObstacle(canvas, sortedObstacles[obsIdx], width, height, horizonY, vanishingX)
                obsIdx++
            }
        }

        // 4. Player
        drawPlayer(canvas, engine.player, width, height, horizonY, vanishingX)

        // 5. HUD Overlay
        drawHUD(canvas, engine, width, height)

        // 6. Game State Overlays
        if (engine.state == GameState.GAME_OVER) {
            drawGameOver(canvas, engine, width, height)
        } else if (engine.state == GameState.START) {
            drawStartScreen(canvas, width, height)
        }
    }

    private fun project3D(
        laneX: Float,
        y: Float,
        z: Float,
        width: Int,
        height: Int,
        horizonY: Float,
        vanishingX: Float
    ): Triple<Float, Float, Float> {
        val fov = 1.0f
        val safeZ = (z + 2.0f).coerceAtLeast(0.1f)
        val scale = (fov / safeZ) * 8f

        val groundY = height * 0.88f
        val screenX = vanishingX + (laneX * width * 0.22f) * scale
        val screenY = groundY - (y * height * 0.12f) * scale - (1f - scale.coerceIn(0f, 1f)) * (groundY - horizonY)
        return Triple(screenX, screenY, scale)
    }

    private fun drawTracks(
        canvas: Canvas,
        width: Int,
        height: Int,
        horizonY: Float,
        vanishingX: Float,
        distance: Float
    ) {
        val bottomY = height.toFloat()
        val trackWidthBottom = width * 0.85f

        // Draw track bed polygon
        val bedPath = Path().apply {
            moveTo(vanishingX - width * 0.1f, horizonY)
            lineTo(vanishingX + width * 0.1f, horizonY)
            lineTo(vanishingX + trackWidthBottom * 0.5f, bottomY)
            lineTo(vanishingX - trackWidthBottom * 0.5f, bottomY)
            close()
        }
        canvas.drawPath(bedPath, trackBedPaint)

        // Moving Railroad ties (sleepers)
        val numTies = 18
        for (i in 0 until numTies) {
            val tieZ = ((i * 3.5f - (distance % 3.5f)) + 3.5f)
            if (tieZ in 0.5f..55f) {
                val (_, y1, s1) = project3D(0f, 0f, tieZ, width, height, horizonY, vanishingX)
                val tieWidth = width * 0.75f * s1
                canvas.drawRect(
                    vanishingX - tieWidth * 0.5f,
                    y1 - 3f * s1,
                    vanishingX + tieWidth * 0.5f,
                    y1 + 4f * s1,
                    tiePaint
                )
            }
        }

        // Draw 4 perspective rails separating 3 lanes
        val railLanes = listOf(-1.5f, -0.5f, 0.5f, 1.5f)
        for (r in railLanes) {
            val (xTop, yTop, _) = project3D(r, 0f, 50f, width, height, horizonY, vanishingX)
            val (xBottom, yBottom, _) = project3D(r, 0f, 0.5f, width, height, horizonY, vanishingX)
            canvas.drawLine(xTop, yTop, xBottom, yBottom, railPaint)
        }
    }

    private fun drawObstacle(
        canvas: Canvas,
        obs: Obstacle,
        width: Int,
        height: Int,
        horizonY: Float,
        vanishingX: Float
    ) {
        if (obs.z <= 0.1f) return
        val (sx, sy, scale) = project3D(obs.lane.toFloat(), obs.bottomOffset, obs.z, width, height, horizonY, vanishingX)
        val w = obs.width * 140f * scale
        val h = obs.height * 140f * scale

        when (obs.type) {
            ObstacleType.HURDLE -> {
                // Low barrier
                canvas.drawRect(sx - w * 0.5f, sy - h, sx + w * 0.5f, sy, hurdlePaint)
            }
            ObstacleType.HIGH_BARRIER -> {
                // High overhead beam with open bottom
                val legWidth = w * 0.15f
                // Left & right posts
                canvas.drawRect(sx - w * 0.5f, sy - h, sx - w * 0.5f + legWidth, sy + h * 0.8f, barrierPaint)
                canvas.drawRect(sx + w * 0.5f - legWidth, sy - h, sx + w * 0.5f, sy + h * 0.8f, barrierPaint)
                // Top crossbar
                canvas.drawRect(sx - w * 0.5f, sy - h, sx + w * 0.5f, sy - h * 0.4f, barrierPaint)
            }
            ObstacleType.TRAIN_BLOCK -> {
                // Large train wagon front
                canvas.drawRoundRect(sx - w * 0.5f, sy - h, sx + w * 0.5f, sy, 12f * scale, 12f * scale, trainPaint)
                // Headlights
                val hlRadius = 10f * scale
                canvas.drawCircle(sx - w * 0.3f, sy - h * 0.25f, hlRadius, headlightPaint)
                canvas.drawCircle(sx + w * 0.3f, sy - h * 0.25f, hlRadius, headlightPaint)
            }
        }
    }

    private fun drawCoin(
        canvas: Canvas,
        coin: Coin,
        width: Int,
        height: Int,
        horizonY: Float,
        vanishingX: Float
    ) {
        if (coin.z <= 0.1f) return
        val (sx, sy, scale) = project3D(coin.lane.toFloat(), coin.y, coin.z, width, height, horizonY, vanishingX)
        val radius = 16f * scale
        val animRadius = radius * kotlin.math.abs(kotlin.math.cos(Math.toRadians(coin.rotation.toDouble()))).toFloat().coerceAtLeast(0.3f)

        // Shadow
        val (_, shadowY, _) = project3D(coin.lane.toFloat(), 0f, coin.z, width, height, horizonY, vanishingX)
        canvas.drawOval(RectF(sx - radius * 0.8f, shadowY - 4f * scale, sx + radius * 0.8f, shadowY + 4f * scale), shadowPaint)

        // Coin
        canvas.drawOval(RectF(sx - animRadius, sy - radius, sx + animRadius, sy + radius), coinPaint)
        canvas.drawOval(RectF(sx - animRadius * 0.6f, sy - radius * 0.6f, sx + animRadius * 0.6f, sy + radius * 0.6f), coinInnerPaint)
    }

    private fun drawPlayer(
        canvas: Canvas,
        player: Player,
        width: Int,
        height: Int,
        horizonY: Float,
        vanishingX: Float
    ) {
        val (sx, sy, scale) = project3D(player.currentX, player.y, 0.8f, width, height, horizonY, vanishingX)
        val (_, shadowY, _) = project3D(player.currentX, 0f, 0.8f, width, height, horizonY, vanishingX)

        val playerW = 80f * scale
        val playerH = player.getEffectiveHeight() * 110f * scale

        // Ground shadow
        val shadowScale = (1f - (player.y / 4f)).coerceIn(0.4f, 1f)
        canvas.drawOval(
            RectF(sx - playerW * 0.6f * shadowScale, shadowY - 8f * scale, sx + playerW * 0.6f * shadowScale, shadowY + 8f * scale),
            shadowPaint
        )

        if (player.isSliding) {
            // Sliding / Ducking pose (horizontal capsule)
            canvas.drawRoundRect(sx - playerW * 0.6f, sy - playerH, sx + playerW * 0.6f, sy, 16f, 16f, playerBodyPaint)
            canvas.drawCircle(sx + playerW * 0.35f, sy - playerH * 0.5f, playerH * 0.4f, playerHeadPaint)
        } else {
            // Running / Jumping upright pose
            // Legs
            canvas.drawRect(sx - playerW * 0.35f, sy - playerH * 0.4f, sx - playerW * 0.1f, sy, playerBodyPaint)
            canvas.drawRect(sx + playerW * 0.1f, sy - playerH * 0.4f, sx + playerW * 0.35f, sy, playerBodyPaint)
            // Torso / Shirt
            canvas.drawRect(sx - playerW * 0.4f, sy - playerH * 0.8f, sx + playerW * 0.4f, sy - playerH * 0.35f, playerShirtPaint)
            // Head
            canvas.drawCircle(sx, sy - playerH * 0.95f, playerH * 0.2f, playerHeadPaint)
        }
    }

    private fun drawHUD(canvas: Canvas, engine: GameEngine, width: Int, height: Int) {
        textPaint.textSize = 46f
        textPaint.color = Color.WHITE
        textPaint.textAlign = Paint.Align.LEFT
        canvas.drawText("SCORE: ${engine.getScore()}", 40f, 90f, textPaint)

        textPaint.color = Color.parseColor("#F1C40F")
        canvas.drawText("COINS: ${engine.coinCount}", 40f, 150f, textPaint)

        textPaint.textAlign = Paint.Align.RIGHT
        textPaint.color = Color.parseColor("#74B9FF")
        val speedKmh = (engine.currentSpeed * 3.6f).toInt()
        canvas.drawText("${speedKmh} km/h", width - 40f, 90f, textPaint)
    }

    private fun drawGameOver(canvas: Canvas, engine: GameEngine, width: Int, height: Int) {
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), overlayPaint)

        textPaint.textAlign = Paint.Align.CENTER
        textPaint.textSize = 80f
        textPaint.color = Color.parseColor("#E74C3C")
        canvas.drawText("GAME OVER", width * 0.5f, height * 0.38f, textPaint)

        textPaint.textSize = 50f
        textPaint.color = Color.WHITE
        canvas.drawText("Final Score: ${engine.getScore()}", width * 0.5f, height * 0.47f, textPaint)
        canvas.drawText("High Score: ${engine.highScore}", width * 0.5f, height * 0.54f, textPaint)
        canvas.drawText("Coins Collected: ${engine.coinCount}", width * 0.5f, height * 0.61f, textPaint)

        textPaint.textSize = 42f
        textPaint.color = Color.parseColor("#2ECC71")
        canvas.drawText("TAP OR SWIPE TO RESTART", width * 0.5f, height * 0.72f, textPaint)
    }

    private fun drawStartScreen(canvas: Canvas, width: Int, height: Int) {
        textPaint.textAlign = Paint.Align.CENTER
        textPaint.textSize = 64f
        textPaint.color = Color.WHITE
        canvas.drawText("SUBWAY RUNNER", width * 0.5f, height * 0.35f, textPaint)

        textPaint.textSize = 38f
        textPaint.color = Color.parseColor("#00CEC9")
        canvas.drawText("Swipe Left/Right to Switch Lanes", width * 0.5f, height * 0.48f, textPaint)
        canvas.drawText("Swipe Up to Jump over Barriers", width * 0.5f, height * 0.54f, textPaint)
        canvas.drawText("Swipe Down to Slide under Beams", width * 0.5f, height * 0.60f, textPaint)

        textPaint.textSize = 48f
        textPaint.color = Color.parseColor("#F1C40F")
        canvas.drawText("SWIPE UP TO START", width * 0.5f, height * 0.72f, textPaint)
    }
}

package com.rea.games.runner

class Player {
    var targetLane: Int = 0 // -1: Left, 0: Center, 1: Right
    var currentX: Float = 0f // Interpolated visual X (-1f to 1f)
    
    var y: Float = 0f // Vertical height (0 = ground, > 0 = airborne)
    var vy: Float = 0f // Vertical velocity
    var isJumping: Boolean = false
    
    var isSliding: Boolean = false
    var slideTimer: Float = 0f
    val maxSlideDuration: Float = 0.8f // seconds

    val jumpVelocity: Float = 14f
    val gravity: Float = 32f

    fun reset() {
        targetLane = 0
        currentX = 0f
        y = 0f
        vy = 0f
        isJumping = false
        isSliding = false
        slideTimer = 0f
    }

    fun moveLeft() {
        if (targetLane > -1) {
            targetLane -= 1
        }
    }

    fun moveRight() {
        if (targetLane < 1) {
            targetLane += 1
        }
    }

    fun jump() {
        if (!isJumping && !isSliding) {
            isJumping = true
            vy = jumpVelocity
        }
    }

    fun slide() {
        if (isJumping) {
            // Fast fall
            vy = -jumpVelocity * 1.5f
        } else if (!isSliding) {
            isSliding = true
            slideTimer = maxSlideDuration
        }
    }

    fun update(dt: Float) {
        // Smooth lane interpolation
        val lerpSpeed = 12f
        currentX += (targetLane - currentX) * (lerpSpeed * dt).coerceAtMost(1f)

        // Jump physics
        if (isJumping) {
            y += vy * dt
            vy -= gravity * dt
            if (y <= 0f) {
                y = 0f
                vy = 0f
                isJumping = false
            }
        }

        // Slide timer
        if (isSliding) {
            slideTimer -= dt
            if (slideTimer <= 0f) {
                isSliding = false
                slideTimer = 0f
            }
        }
    }

    fun getEffectiveHeight(): Float {
        return if (isSliding) 0.5f else 1.6f
    }
}

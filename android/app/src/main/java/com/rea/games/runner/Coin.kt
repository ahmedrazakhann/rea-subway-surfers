package com.rea.games.runner

data class Coin(
    val lane: Int,
    var z: Float,
    val y: Float = 0.5f,
    var collected: Boolean = false,
    var rotation: Float = 0f
) {
    fun update(dt: Float) {
        rotation = (rotation + 180f * dt) % 360f
    }
}

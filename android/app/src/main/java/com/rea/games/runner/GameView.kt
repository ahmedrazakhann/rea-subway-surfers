package com.rea.games.runner

import android.content.Context
import android.graphics.PixelFormat
import android.util.AttributeSet
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import kotlin.math.abs

class GameView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : SurfaceView(context, attrs), SurfaceHolder.Callback, Runnable {

    private var gameThread: Thread? = null
    @Volatile
    private var isPlaying = false

    val engine = GameEngine()
    private val renderer = Renderer()

    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        private val SWIPE_THRESHOLD = 50
        private val SWIPE_VELOCITY_THRESHOLD = 50

        override fun onDown(e: MotionEvent): Boolean = true

        override fun onSingleTapUp(e: MotionEvent): Boolean {
            if (engine.state == GameState.GAME_OVER) {
                engine.restart()
                return true
            } else if (engine.state == GameState.START) {
                engine.start()
                return true
            }
            return super.onSingleTapUp(e)
        }

        override fun onFling(
            e1: MotionEvent?,
            e2: MotionEvent,
            velocityX: Float,
            velocityY: Float
        ): Boolean {
            if (e1 == null) return false
            val diffX = e2.x - e1.x
            val diffY = e2.y - e1.y

            if (engine.state == GameState.GAME_OVER) {
                engine.restart()
                return true
            }
            if (engine.state == GameState.START) {
                engine.start()
                return true
            }

            if (abs(diffX) > abs(diffY)) {
                // Horizontal Swipe (Lane Change)
                if (abs(diffX) > SWIPE_THRESHOLD && abs(velocityX) > SWIPE_VELOCITY_THRESHOLD) {
                    if (diffX > 0) {
                        engine.player.moveRight()
                    } else {
                        engine.player.moveLeft()
                    }
                    return true
                }
            } else {
                // Vertical Swipe (Jump or Slide)
                if (abs(diffY) > SWIPE_THRESHOLD && abs(velocityY) > SWIPE_VELOCITY_THRESHOLD) {
                    if (diffY < 0) {
                        engine.player.jump()
                    } else {
                        engine.player.slide()
                    }
                    return true
                }
            }
            return false
        }
    })

    init {
        holder.addCallback(this)
        holder.setFormat(PixelFormat.TRANSLUCENT)
        isFocusable = true
    }

    fun resume() {
        isPlaying = true
        gameThread = Thread(this).apply { start() }
    }

    fun pause() {
        isPlaying = false
        try {
            gameThread?.join()
        } catch (_: InterruptedException) {}
        gameThread = null
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        resume()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        pause()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        return gestureDetector.onTouchEvent(event) || super.onTouchEvent(event)
    }

    override fun run() {
        var lastTime = System.nanoTime()

        while (isPlaying) {
            val now = System.nanoTime()
            val dt = ((now - lastTime) / 1_000_000_000.0).toFloat().coerceIn(0.001f, 0.05f)
            lastTime = now

            // 1. Update Game Physics & State
            engine.update(dt)

            // 2. Render Frame
            if (holder.surface.isValid) {
                val canvas = holder.lockCanvas()
                if (canvas != null) {
                    try {
                        renderer.render(canvas, engine, width, height)
                    } finally {
                        holder.unlockCanvasAndPost(canvas)
                    }
                }
            }

            // Target 60 FPS (~16ms)
            try {
                val elapsedMs = (System.nanoTime() - now) / 1_000_000
                val sleepMs = 16 - elapsedMs
                if (sleepMs > 0) {
                    Thread.sleep(sleepMs)
                }
            } catch (_: InterruptedException) {}
        }
    }
}

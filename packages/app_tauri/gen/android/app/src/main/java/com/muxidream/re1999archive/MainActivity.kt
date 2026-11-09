package com.muxidream.re1999archive

import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
       super.onCreate(savedInstanceState)

        // 启用 Edge-to-Edge
        enableEdgeToEdge()

        // 允许内容绘制到系统栏区域
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // 状态栏透明
        window.statusBarColor = Color.TRANSPARENT
  }

   fun setStatusBarLightIcons(light: Boolean) {
       // false = 白色状态栏图标
        WindowInsetsControllerCompat(
            window,
            window.decorView
        ).isAppearanceLightStatusBars = light
    }
}

package com.muxidream.re1999archive

import android.app.Activity
import android.content.Intent
import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import app.tauri.plugin.JSObject

import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.URLConnection
import java.security.MessageDigest


@InvokeArg
data class SetStatusBarLightArgs(
    val light: Boolean = false
)

@InvokeArg
data class ApkPathArgs(
    val path: String = ""
)

@InvokeArg
data class SaveImageArgs(
    val fileName: String = "download.bin",
    val bytes: ByteArray = byteArrayOf()
)

@TauriPlugin
class StatusBarPlugin(
    private val activity: Activity
) : Plugin(activity) {

    private var installerLaunched = false
    private var installerPaused = false

    init {
        check(activity is LifecycleOwner)
        (activity as LifecycleOwner).lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onPause(owner: LifecycleOwner) {
                if (installerLaunched) installerPaused = true
            }

            override fun onResume(owner: LifecycleOwner) {
                if (installerLaunched && installerPaused) {
                    installerLaunched = false
                    installerPaused = false
                }
            }
        })
    }

    @Command
    fun setStatusBarLight(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(SetStatusBarLightArgs::class.java)
            
            WindowInsetsControllerCompat(
                activity.window,
                activity.window.decorView
            ).isAppearanceLightStatusBars = args.light
            
            invoke.resolve(
                JSObject().put("success", true)
            )
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @Command
    fun getApkMd5(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ApkPathArgs::class.java)
            val apk = validateApkPath(args.path)
            val digest = MessageDigest.getInstance("MD5")
            FileInputStream(apk).use { input ->
                val buffer = ByteArray(64 * 1024)
                while (true) {
                    val count = input.read(buffer)
                    if (count < 0) break
                    digest.update(buffer, 0, count)
                }
            }
            val hash = digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) }
            invoke.resolve(JSObject().put("hash", hash))
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @Command
    fun openApk(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ApkPathArgs::class.java)
            val apk = validateApkPath(args.path)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                !activity.packageManager.canRequestPackageInstalls()
            ) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:${activity.packageName}")
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                activity.startActivity(intent)
                throw IllegalStateException("请先允许此应用安装未知应用，然后再次点击立即安装")
            }

            val uri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.fileprovider",
                apk
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            installerLaunched = true
            activity.startActivity(intent)
            invoke.resolve()
        } catch (e: Exception) {
            installerLaunched = false
            installerPaused = false
            invoke.reject(e.message)
        }
    }

    @Command
    fun isApkInstallInProgress(invoke: Invoke) {
        invoke.resolve(JSObject().put("inProgress", installerLaunched))
    }

    @Command
    fun saveImage(invoke: Invoke) {
        var insertedUri: Uri? = null
        try {
            val args = invoke.parseArgs(SaveImageArgs::class.java)
            require(args.bytes.isNotEmpty()) { "图片内容为空" }
            val fileName = sanitizeFileName(args.fileName)
            val mimeType = URLConnection.guessContentTypeFromName(fileName) ?: "image/jpeg"

            val savedUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                    put(MediaStore.Images.Media.MIME_TYPE, mimeType)
                    put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/重返未来1999壁纸")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
                val resolver = activity.contentResolver
                insertedUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                    ?: throw IllegalStateException("无法创建相册文件")
                resolver.openOutputStream(insertedUri!!)?.use { it.write(args.bytes) }
                    ?: throw IllegalStateException("无法写入相册文件")
                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(insertedUri!!, values, null, null)
                insertedUri!!
            } else {
                @Suppress("DEPRECATION")
                val directory = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "重返未来1999壁纸")
                require(directory.exists() || directory.mkdirs()) { "无法创建图片目录" }
                val target = availableFile(directory, fileName)
                FileOutputStream(target).use { it.write(args.bytes) }
                activity.sendBroadcast(Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(target)))
                Uri.fromFile(target)
            }

            invoke.resolve(JSObject().put("uri", savedUri.toString()))
        } catch (e: Exception) {
            insertedUri?.let { activity.contentResolver.delete(it, null, null) }
            invoke.reject(e.message ?: "保存图片失败")
        }
    }

    private fun validateApkPath(path: String): File {
        val apk = File(path).canonicalFile
        val expectedDirectory = File(activity.filesDir, "apk-updates").canonicalFile
        require(apk.parentFile == expectedDirectory && apk.name == "update.apk") {
            "安装包路径无效"
        }
        require(apk.isFile) { "更新安装包不存在" }
        return apk
    }

    private fun sanitizeFileName(fileName: String): String {
        val name = fileName.substringAfterLast('/').substringAfterLast('\\')
            .filterNot { it.isISOControl() || it in "<>:\"|?*" }
        return name.takeIf { it.isNotBlank() && it != "." && it != ".." } ?: "download.jpg"
    }

    private fun availableFile(directory: File, fileName: String): File {
        val initial = File(directory, fileName)
        if (!initial.exists()) return initial
        val dot = fileName.lastIndexOf('.')
        val stem = if (dot > 0) fileName.substring(0, dot) else fileName
        val extension = if (dot > 0) fileName.substring(dot) else ""
        for (index in 1..9999) {
            val candidate = File(directory, "$stem ($index)$extension")
            if (!candidate.exists()) return candidate
        }
        return File(directory, "${stem}_${System.currentTimeMillis()}$extension")
    }
}

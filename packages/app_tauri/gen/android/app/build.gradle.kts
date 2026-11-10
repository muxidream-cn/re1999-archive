import java.io.FileInputStream
import java.util.Properties

plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("rust")
}

val tauriProperties =
  Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
      propFile.inputStream().use { load(it) }
    }
  }

/** Rust target / flavor 名到 Android ABI 的映射，用于区分各架构的 release 安装包 */
val abiAliases =
  mapOf(
    "aarch64" to "arm64-v8a",
    "armv7" to "armeabi-v7a",
    "i686" to "x86",
    "arm64" to "arm64-v8a",
    "arm" to "armeabi-v7a",
  )

/** Tauri CLI 通过 -PabiList / -PtargetList 限制实际打包的 ABI，未传时为空 */
val tauriAbiList = (project.findProperty("abiList") as? String)?.split(',')?.map { it.trim() }?.filter { it.isNotEmpty() }.orEmpty()
val tauriTargetList = (project.findProperty("targetList") as? String)?.split(',')?.map { it.trim() }?.filter { it.isNotEmpty() }.orEmpty()

android {
  compileSdk = 36
  namespace = "com.muxidream.re1999archive"
  defaultConfig {
    manifestPlaceholders["usesCleartextTraffic"] = "false"
    applicationId = "com.muxidream.re1999archive"
    minSdk = 24
    targetSdk = 36
    versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
    versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
  }
  signingConfigs {
    create("release") {
      val keystorePropertiesFile = rootProject.file("keystore.properties")
      val keystoreProperties = Properties()
      if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(FileInputStream(keystorePropertiesFile))
      }
      keyAlias = keystoreProperties["keyAlias"] as String
      keyPassword = keystoreProperties["keyPassword"] as String
      storeFile = file(keystoreProperties["storeFile"] as String)
      storePassword = keystoreProperties["storePassword"] as String
    }
  }
  buildTypes {
    getByName("debug") {
      applicationIdSuffix = ".debug"
      manifestPlaceholders["usesCleartextTraffic"] = "true"
      isDebuggable = true
      isJniDebuggable = true
      isMinifyEnabled = false
      packaging {
        jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
        jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
        jniLibs.keepDebugSymbols.add("*/x86/*.so")
        jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
      }
    }
    getByName("release") {
      // 添加签名
      signingConfig = signingConfigs.getByName("release")

      isMinifyEnabled = true
      proguardFiles(
        *fileTree(".") { include("**/*.pro") }
          .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
          .toList()
          .toTypedArray(),
      )
    }
  }
  // rust 插件按架构创建 flavor 并声明 abiFilters，这里先收集起来供 release 产物命名使用
  val flavorAbis = mutableMapOf<String, List<String>>()
  productFlavors.all {
    flavorAbis[name] = ndk.abiFilters.toList()
  }

  applicationVariants.all {
    val variant = this
    // 明确判断：只有 release 构建才执行重命名
    if (variant.buildType.name == "release") {
      /*
       * 按架构区分产物：多架构分别构建时若同名会互相覆盖。
       * 依次从「flavor 声明的 ABI 过滤 → Tauri 传入的 abiList → targetList → flavor 名」推断，
       * 都无法确定（如一次打出全部架构）时回落 universal。
       */
      val declaredAbis = flavorAbis[variant.flavorName].orEmpty()
      val abiLabel =
        declaredAbis.singleOrNull()
          ?: tauriAbiList.singleOrNull()
          ?: tauriTargetList.singleOrNull()?.let { abiAliases[it] ?: it }
          ?: abiAliases[variant.flavorName]
          ?: "universal"

      logger.lifecycle("release 产物命名使用 ABI 标签: $abiLabel (${variant.name})")

      outputs.all {
        val output = this as com.android.build.gradle.internal.api.BaseVariantOutputImpl
        val appName = "默默的小站：游戏壁纸"
        val versionName = variant.versionName

        // 使用字符串拼接，防止 IDE 吞掉花括号
        output.outputFileName = appName + "_" + versionName + "_" + abiLabel + ".apk"
      }
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }
  kotlinOptions {
    jvmTarget = "11"
  }
  buildFeatures {
    buildConfig = true
  }
}

rust {
  rootDirRel = "../../../"
}

dependencies {
  implementation("androidx.webkit:webkit:1.14.0")
  implementation("androidx.appcompat:appcompat:1.7.1")
  implementation("androidx.activity:activity-ktx:1.10.1")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.lifecycle:lifecycle-process:2.10.0")
  testImplementation("junit:junit:4.13.2")
  androidTestImplementation("androidx.test.ext:junit:1.1.4")
  androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")
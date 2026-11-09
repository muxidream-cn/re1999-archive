# tauri2

## 依赖安装

因为项目是 Android 和 Windows 这类页面部分与 Tauri 应用部分分离的，前端和 tauri-src 不在同一目录下，所以不能直接调用 tauri 命令自动安装依赖。

**错误安装方式：**

``` bash
# 在任意目录执行下方命令均无法正确安装，因为前端和 tauri-src 不在同一目录下
pnpm tauri add updater 
```

**正确步骤如下：**
1、在tauri项目内安装 [tauri项目目录](../)

``` bash
cargo add tauri-plugin-updater --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

2、在 `lib.rs` 中使用插件

``` rust
# [cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
#下两行
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3、在需要的前端项目内安装 [windows项目目录](../../app_windows)

``` bash
pnpm add @tauri-apps/plugin-updater
```

## 安卓端真机调试

1、无线调试
> (1).手机和电脑处在同一网络下，有线网和无线网都可以，但需要在同一网关
> (2).手机打开开发者模式
> (3).手机打开无线调试，点进去能看见手机的IP地址和端口（设备重启过或重连过网络可能会变化）
> (4).在电脑终端输入 `adb connect <手机IP和端口>`。如果连接失败，先开启手机USB调试权限，打开文件传输权限，再输入adb连接命令，连接成功后就可以拔掉USB线了
> (5).在电脑终端输入 `adb devices`，会看到当前所有的真机和安卓模拟器设备
> (6).修改安卓项目的IP基地址，即`packages\app_android\.env.development`下的VITE_APP_BASE_API。因为模拟器和真机所用的IP不一样，模拟器使用 `http://10.0.2.2:<后端项目端口>` 映射到本机(需另行配置)，而真机需要通过电脑在终端通过`ipconfig`查询本机的IP直连(如果电脑没固定IP，同第(3)步，每次连接网络IP可能都会改变)，真机改为 `<电脑IP>:<后端项目端口>`
> (7).启动安卓项目时，如果你同时连了多个安卓设备或模拟机，可能会让你选择在哪台设备上启动，或者可以手动更改顺序

## 修改安卓打包签名设置

具体步骤看教程链接：[官网教程](https://tauri.app/distribute/sign/android/) | [中文教程](https://v2.tauri.org.cn/distribute/sign/android/)

需要自己创建 `keystore.properties`

``` properties
# src-tauri\gen\android\keystore.properties
# 填写示例如下：

# 签名文件（.jks / .keystore）的密码
storePassword=123456
# 密钥（key）的密码
keyPassword=123456
# 密钥别名（key alias）
keyAlias=example
# 签名文件路径（.jks / .keystore）
storeFile=C:\\keys\\example-keystore.jks
```

然后在`src-tauri\gen\android\app\build.gradle.kts`导入，具体看上方官网链接，需要注意的是要对齐自己创建的`keystore.properties`文件名和字段名

## 修改安卓程序名称

src-tauri/gen/ 目录下的文件是由 `tauri android init` 生成的，如果将来重新执行初始化，这个文件可能会被覆盖还原。
修改后重新打包即可生效。

``` xml
<!-- src-tauri/gen/android/app/src/main/res/values/strings.xml -->
<resources>
    <string name="app_name">"Tauri-app"</string>
    <string name="main_activity_title">"Tauri-app"</string>
</resources>
```

## 修改安卓打包后生成的 APK 命名

在`src-tauri\gen\android\app\build.gradle.kts`中，`buildTypes`的后方添加如下代码(注意与`buildTypes`同级)

``` kts
  applicationVariants.all {
    val variant = this
    // 明确判断：只有 release 构建才执行重命名
    if (variant.buildType.name == "release") {
      outputs.all {
        val output = this as com.android.build.gradle.internal.api.BaseVariantOutputImpl
        val appName = "example" //此处写文件名
        val versionName = variant.versionName //此处获取本次的版本号

        // 使用字符串拼接最终命名，防止 IDE 吞掉花括号
        output.outputFileName = appName + "_" + versionName + ".apk"
      }
    }
  }
```

## 指定Java环境

如果系统变量中的 JAVA_HOME 的java环境过高/不兼容/未设置，可以在此文件中指定某个版本的JAVA目录

``` properties
# src-tauri\gen\android\gradle.properties
# 填写示例如下：

# 手动指定此版本的JAVA目录
org.gradle.java.home=D\:\\java\\jdk-21.0.12
```

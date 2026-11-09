# 本插件的 consumer proguard 规则
#
# build.gradle.kts 通过 consumerProguardFiles("consumer-rules.pro") 引用此文件，
# 缺少时 AGP 会警告「Supplied consumer proguard configuration does not exist」。
#
# 当前插件没有需要保留的反射入口：StatusBarPlugin 通过 @TauriPlugin 注解注册，
# 命令通过 @Command 注解映射，Tauri 的 android 运行时不会依赖混淆后的类名。
# 后续若新增需要反射访问的类，在此补充 -keep 规则。

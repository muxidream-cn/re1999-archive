#[cfg(target_os = "android")]
mod android_apk;
mod downloads;

// Manager 提供 get_webview_window，只在桌面端与 debug 构建的分支里用到；
// 移动端 release 构建会把这些分支整块剔除，因此按同样条件导入避免 unused 告警
#[cfg(any(desktop, debug_assertions))]
use tauri::Manager;

/// 关闭 WebView2 的原生右键菜单（仅 Windows）
///
/// Tauri 没有提供关闭默认菜单的配置项，只能通过 WebView2 的
/// `ICoreWebView2Settings::SetAreDefaultContextMenusEnabled` 处理。
/// 关闭后右键菜单由前端 `AppContextMenu` 接管渲染。
#[cfg(target_os = "windows")]
fn disable_native_context_menu(window: &tauri::WebviewWindow) {
    let result = window.with_webview(|webview| unsafe {
        let controller = webview.controller();
        // Settings 挂在 ICoreWebView2 上，Controller 只是宿主，需要先取 CoreWebView2
        let core = match controller.CoreWebView2() {
            Ok(core) => core,
            Err(error) => {
                log::warn!("获取 CoreWebView2 失败，原生右键菜单可能仍会出现: {error}");
                return;
            }
        };
        let settings = match core.Settings() {
            Ok(settings) => settings,
            Err(error) => {
                log::warn!("获取 WebView2 设置失败，原生右键菜单可能仍会出现: {error}");
                return;
            }
        };

        if let Err(error) = settings.SetAreDefaultContextMenusEnabled(false) {
            log::warn!("关闭 WebView2 原生右键菜单失败: {error}");
        }
    });

    if let Err(error) = result {
        log::warn!("访问 WebView 失败，无法关闭原生右键菜单: {error}");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();
    // 只在桌面端注册 window-state 插件
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_window_state::Builder::default().build())
            .plugin(tauri_plugin_updater::Builder::new().build());
    }
    builder = builder
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_pinia::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_status_bar::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // 必须注册在 fs 之后，否则持久化 scope 不生效且 dev 模式会告警
        .plugin(tauri_plugin_persisted_scope::init());

    #[cfg(target_os = "android")]
    let builder = builder.invoke_handler(tauri::generate_handler![
        downloads::save_remote_files,
        android_apk::download_android_apk
    ]);

    #[cfg(not(target_os = "android"))]
    let builder = builder.invoke_handler(tauri::generate_handler![downloads::save_remote_files]);

    builder
        .setup(|_app| {
            // 原生菜单开发与生产统一关闭：会被前端自定义菜单替代
            #[cfg(target_os = "windows")]
            if let Some(window) = _app.get_webview_window("main") {
                disable_native_context_menu(&window);
            }

            // 仅 debug 构建打开调试面板；release 不需要控制台。
            // open_devtools 的门控是 any(debug_assertions, feature = "devtools")，
            // 必须用编译期属性剔除：cfg! 是运行时判断，release 下仍会参与编译并报 E0599
            #[cfg(debug_assertions)]
            {
                if let Some(window) = _app.get_webview_window("main") {
                    window.open_devtools();
                }

                _app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用程序时出错");
}

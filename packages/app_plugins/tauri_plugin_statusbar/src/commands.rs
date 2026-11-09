use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::Result;
use crate::StatusBarExt;

#[command]
pub(crate) async fn set_statusbar_light<R: Runtime>(
    app: AppHandle<R>,
    light: bool,
) -> Result<SetStatusBarLightResponse> {
    app.status_bar().set_statusbar_light(light)
}

#[cfg(target_os = "android")]
#[command]
pub(crate) async fn get_apk_md5<R: Runtime>(app: AppHandle<R>, path: String) -> Result<String> {
    app.status_bar().get_apk_md5(path)
}

#[cfg(target_os = "android")]
#[command]
pub(crate) async fn open_apk<R: Runtime>(app: AppHandle<R>, path: String) -> Result<()> {
    app.status_bar().open_apk(path)
}

#[cfg(target_os = "android")]
#[command]
pub(crate) async fn is_apk_install_in_progress<R: Runtime>(app: AppHandle<R>) -> Result<bool> {
    app.status_bar().is_apk_install_in_progress()
}

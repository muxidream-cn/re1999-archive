use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::StatusBar;
#[cfg(mobile)]
use mobile::StatusBar;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the status-bar APIs.
pub trait StatusBarExt<R: Runtime> {
    fn status_bar(&self) -> &StatusBar<R>;
}

impl<R: Runtime, T: Manager<R>> crate::StatusBarExt<R> for T {
    fn status_bar(&self) -> &StatusBar<R> {
        self.state::<StatusBar<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    #[cfg(target_os = "android")]
    let builder = Builder::new("status-bar").invoke_handler(tauri::generate_handler![
        commands::set_statusbar_light,
        commands::get_apk_md5,
        commands::open_apk,
        commands::is_apk_install_in_progress
    ]);

    #[cfg(not(target_os = "android"))]
    let builder = Builder::new("status-bar")
        .invoke_handler(tauri::generate_handler![commands::set_statusbar_light]);

    builder
        .setup(|app, api| {
            #[cfg(mobile)]
            let status_bar = mobile::init(app, api)?;
            #[cfg(desktop)]
            let status_bar = desktop::init(app, api)?;
            app.manage(status_bar);
            Ok(())
        })
        .build()
}

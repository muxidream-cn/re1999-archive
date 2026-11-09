use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<StatusBar<R>> {
  Ok(StatusBar(app.clone()))
}

/// Access to the status-bar APIs.
pub struct StatusBar<R: Runtime>(AppHandle<R>);

impl<R: Runtime> StatusBar<R> {
  pub fn set_statusbar_light(&self, _light: bool) -> crate::Result<SetStatusBarLightResponse> {
    // Desktop doesn't support status bar light mode
    Ok(SetStatusBarLightResponse {
      success: false,
    })
  }
}

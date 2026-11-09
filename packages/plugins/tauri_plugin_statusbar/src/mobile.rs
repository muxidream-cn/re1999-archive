use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

#[cfg(target_os = "android")]
use serde::Deserialize;

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_status_bar);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<StatusBar<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("com.muxidream.re1999archive", "StatusBarPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_status_bar)?;
  Ok(StatusBar(handle))
}

/// Access to the status-bar APIs.
pub struct StatusBar<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> StatusBar<R> {
  pub fn set_statusbar_light(&self, light: bool) -> crate::Result<SetStatusBarLightResponse> {
    self
      .0
      .run_mobile_plugin("setStatusBarLight", light)
      .map_err(Into::into)
  }

  #[cfg(target_os = "android")]
  pub fn get_apk_md5(&self, path: String) -> crate::Result<String> {
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Md5Response {
      hash: String,
    }

    self
      .0
      .run_mobile_plugin::<Md5Response>("getApkMd5", serde_json::json!({ "path": path }))
      .map(|response| response.hash)
      .map_err(Into::into)
  }

  #[cfg(target_os = "android")]
  pub fn open_apk(&self, path: String) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("openApk", serde_json::json!({ "path": path }))
      .map_err(Into::into)
  }

  #[cfg(target_os = "android")]
  pub fn is_apk_install_in_progress(&self) -> crate::Result<bool> {
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct InstallStateResponse {
      in_progress: bool,
    }

    self
      .0
      .run_mobile_plugin::<InstallStateResponse>("isApkInstallInProgress", serde_json::json!({}))
      .map(|response| response.in_progress)
      .map_err(Into::into)
  }

  #[cfg(target_os = "android")]
  pub fn save_image(&self, file_name: String, bytes: Vec<u8>) -> crate::Result<String> {
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct SaveImageResponse {
      uri: String,
    }

    self
      .0
      .run_mobile_plugin::<SaveImageResponse>(
        "saveImage",
        serde_json::json!({ "fileName": file_name, "bytes": bytes }),
      )
      .map(|response| response.uri)
      .map_err(Into::into)
  }

}

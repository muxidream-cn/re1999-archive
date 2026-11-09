#[cfg(not(target_os = "android"))]
use std::fs::{create_dir_all, File};
#[cfg(not(target_os = "android"))]
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
#[cfg(all(mobile, not(target_os = "android")))]
use tauri::Manager;
use tauri::{Emitter, Runtime};
#[cfg(desktop)]
use tauri_plugin_dialog::DialogExt;
#[cfg(target_os = "android")]
use tauri_plugin_status_bar::StatusBarExt;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadItem {
    url: String,
    file_name: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    completed: usize,
    total: usize,
    file_name: String,
    error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResult {
    file_name: String,
    path: Option<String>,
    cancelled: bool,
    error: Option<String>,
}

fn sanitize_file_name(file_name: &str) -> String {
    let file_name = file_name.rsplit(['/', '\\']).next().unwrap_or_default();
    let sanitized: String = file_name
        .chars()
        .filter(|character| {
            !character.is_control() && !matches!(character, '<' | '>' | ':' | '"' | '|' | '?' | '*')
        })
        .collect();

    if sanitized.is_empty() || sanitized == "." || sanitized == ".." {
        "download.bin".to_string()
    } else {
        sanitized
    }
}

#[cfg(not(target_os = "android"))]
fn available_target(folder: &Path, file_name: &str) -> PathBuf {
    let target = folder.join(file_name);
    if !target.exists() {
        return target;
    }

    let stem = Path::new(file_name)
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("download");
    let extension = Path::new(file_name)
        .extension()
        .and_then(|value| value.to_str());
    for index in 1..10000 {
        let candidate_name = match extension {
            Some(extension) => format!("{stem} ({index}).{extension}"),
            None => format!("{stem} ({index})"),
        };
        let candidate = folder.join(candidate_name);
        if !candidate.exists() {
            return candidate;
        }
    }
    folder.join(format!("{stem}_download.bin"))
}

async fn save_remote_file<R: Runtime>(
    _app: &tauri::AppHandle<R>,
    client: &reqwest::Client,
    _folder: &Path,
    mut item: DownloadItem,
) -> DownloadResult {
    item.file_name = sanitize_file_name(&item.file_name);
    let parsed_url = match reqwest::Url::parse(&item.url) {
        Ok(url) if matches!(url.scheme(), "http" | "https") => url,
        Ok(_) => {
            return DownloadResult {
                file_name: item.file_name,
                path: None,
                cancelled: false,
                error: Some("仅支持 HTTP 或 HTTPS 下载地址".to_string()),
            };
        }
        Err(error) => {
            return DownloadResult {
                file_name: item.file_name,
                path: None,
                cancelled: false,
                error: Some(format!("下载地址无效：{error}")),
            };
        }
    };

    #[cfg(not(target_os = "android"))]
    let target = available_target(_folder, &item.file_name);

    let download = async {
        let response = client
            .get(parsed_url)
            .send()
            .await
            .map_err(|error| error.to_string())?
            .error_for_status()
            .map_err(|error| error.to_string())?;
        let contents = response.bytes().await.map_err(|error| error.to_string())?;
        #[cfg(target_os = "android")]
        let saved_path = _app
            .status_bar()
            .save_image(item.file_name.clone(), contents.to_vec())
            .map_err(|error| error.to_string())?;

        #[cfg(not(target_os = "android"))]
        let saved_path = {
            let mut file = File::create(&target).map_err(|error| error.to_string())?;
            file.write_all(&contents)
                .map_err(|error| error.to_string())?;
            target.to_string_lossy().into_owned()
        };
        Ok::<String, String>(saved_path)
    }
    .await;

    match download {
        Ok(saved_path) => DownloadResult {
            file_name: item.file_name,
            path: Some(saved_path),
            cancelled: false,
            error: None,
        },
        Err(error) => DownloadResult {
            file_name: item.file_name,
            path: None,
            cancelled: false,
            error: Some(format!("下载或保存失败：{error}")),
        },
    }
}

#[tauri::command]
pub(crate) async fn save_remote_files(
    app: tauri::AppHandle,
    items: Vec<DownloadItem>,
) -> Vec<DownloadResult> {
    if items.is_empty() {
        return Vec::new();
    }

    #[cfg(desktop)]
    let folder = {
        let dialog_app = app.clone();
        tauri::async_runtime::spawn_blocking(move || {
            dialog_app.dialog().file().blocking_pick_folder()
        })
        .await
        .ok()
        .flatten()
        .and_then(|path| path.into_path().ok())
    };

    #[cfg(all(mobile, not(target_os = "android")))]
    let folder = match app.path().picture_dir() {
        Ok(folder) => Some(folder),
        Err(error) => {
            return vec![DownloadResult {
                file_name: "download".to_string(),
                path: None,
                cancelled: false,
                error: Some(format!("获取图片保存目录失败：{error}")),
            }];
        }
    };

    #[cfg(target_os = "android")]
    let folder = Some(PathBuf::new());

    let Some(folder) = folder else {
        return items
            .into_iter()
            .map(|item| DownloadResult {
                file_name: sanitize_file_name(&item.file_name),
                path: None,
                cancelled: true,
                error: None,
            })
            .collect();
    };

    #[cfg(not(target_os = "android"))]
    if let Err(error) = create_dir_all(&folder) {
        return vec![DownloadResult {
            file_name: "download".to_string(),
            path: None,
            cancelled: false,
            error: Some(format!("创建保存目录失败：{error}")),
        }];
    }

    let client = reqwest::Client::new();
    let total = items.len();
    let mut results = Vec::with_capacity(total);

    for (index, item) in items.into_iter().enumerate() {
        let file_name = sanitize_file_name(&item.file_name);
        let result = save_remote_file(&app, &client, &folder, item).await;
        let _ = app.emit(
            "wallpaper-download-progress",
            DownloadProgress {
                completed: index + 1,
                total,
                file_name,
                error: result.error.clone(),
            },
        );
        results.push(result);
    }

    results
}

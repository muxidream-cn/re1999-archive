use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    time::Duration,
};

use tauri::Manager;

fn is_allowed_apk_url(url: &reqwest::Url) -> bool {
    let Some(host) = url.host_str() else {
        return false;
    };

    matches!(url.scheme(), "http" | "https")
        && (host == "muxidream.cn"
            || host.ends_with(".muxidream.cn")
            || host == "gamecms-res.sl916.com"
            || host == "localhost"
            || host == "127.0.0.1"
            || host == "10.0.2.2")
}

async fn download_apk_attempt(
    url: &reqwest::Url,
    temporary_path: &Path,
    expected_size: u64,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(30))
        .timeout(Duration::from_secs(10 * 60))
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() >= 10 {
                attempt.error("APK 下载重定向次数过多")
            } else if is_allowed_apk_url(attempt.url()) {
                attempt.follow()
            } else {
                attempt.stop()
            }
        }))
        .build()
        .map_err(|error| error.to_string())?;
    let mut response = client
        .get(url.clone())
        .header(reqwest::header::ACCEPT_ENCODING, "identity")
        .send()
        .await
        .map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("下载 APK 失败：HTTP {}", response.status()));
    }

    let mut file = File::create(temporary_path).map_err(|error| error.to_string())?;
    let mut downloaded_size = 0_u64;
    while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
        downloaded_size += chunk.len() as u64;
        if expected_size > 0 && downloaded_size > expected_size {
            return Err(format!(
                "下载响应超过接口声明的 APK 大小：预期 {expected_size} 字节"
            ));
        }
        file.write_all(&chunk).map_err(|error| error.to_string())?;
    }
    file.sync_all().map_err(|error| error.to_string())?;

    if expected_size > 0 && downloaded_size != expected_size {
        return Err(format!(
            "下载响应大小不匹配：预期 {expected_size} 字节，实际 {downloaded_size} 字节"
        ));
    }

    let mut file = File::open(temporary_path).map_err(|error| error.to_string())?;
    let mut header = [0_u8; 2];
    file.read_exact(&mut header)
        .map_err(|error| format!("APK 文件头读取失败：{error}"))?;
    if header != [0x50, 0x4b] {
        return Err("下载响应不是 APK/ZIP 文件".to_string());
    }

    Ok(())
}

#[tauri::command]
pub(crate) async fn download_android_apk(
    app: tauri::AppHandle,
    url: String,
    expected_size: u64,
) -> Result<(), String> {
    let url = reqwest::Url::parse(&url).map_err(|error| format!("下载地址无效：{error}"))?;
    if !is_allowed_apk_url(&url) {
        return Err("APK 下载地址不在允许的 HTTP/HTTPS 域名列表中".to_string());
    }

    let update_directory: PathBuf = app
        .path()
        .app_local_data_dir()
        .map_err(|error| error.to_string())?
        .join("files")
        .join("apk-updates");
    fs::create_dir_all(&update_directory).map_err(|error| error.to_string())?;

    let temporary_path = update_directory.join("update.apk.part");
    let apk_path = update_directory.join("update.apk");
    let mut last_error = String::new();
    for attempt in 1..=3 {
        let _ = fs::remove_file(&temporary_path);
        match download_apk_attempt(&url, &temporary_path, expected_size).await {
            Ok(()) => {
                fs::rename(&temporary_path, &apk_path).map_err(|error| error.to_string())?;
                return Ok(());
            }
            Err(error) => {
                last_error = error;
                let _ = fs::remove_file(&temporary_path);
                if attempt < 3 {
                    tokio::time::sleep(Duration::from_secs(attempt)).await;
                }
            }
        }
    }

    Err(format!("APK 下载连续失败 3 次：{last_error}"))
}

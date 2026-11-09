const COMMANDS: &[&str] = &[
    "ping",
    "set_statusbar_light",
    "get_apk_md5",
    "open_apk",
    "is_apk_install_in_progress",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}

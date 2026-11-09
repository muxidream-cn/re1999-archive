import { invoke } from "@tauri-apps/api/core"

export async function setStatusBarLight(light: boolean): Promise<boolean> {
  return await invoke<{ success: boolean }>("plugin:status-bar|set_statusbar_light", {
    light,
  }).then((r) => r.success)
}

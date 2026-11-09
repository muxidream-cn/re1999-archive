import type { AppServices } from "@app/core/types/adapters"

const publicServices: AppServices = {
  reload: () => window.location.reload(),
  checkUpdate: async () => null,
  relaunch: () => null,
}

export default publicServices

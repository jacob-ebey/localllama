import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export type GlobalSettings = {
  defaultModel: string;
  defaultTemperature: number;
  defaultSystemPrompt: string;
  ollamaHost: string;
  defaultOllamaHost: string;
};

function getGlobalSettingsFilePath() {
  return path.join(os.homedir(), ".localllama", "settings.json");
}

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const defaultOllamaHost = process.env.OLLAMA_HOST ?? "http://localhost:11434";
  try {
    await fsp.mkdir(path.dirname(getGlobalSettingsFilePath()), {
      recursive: true,
    });
    const content = await fsp.readFile(getGlobalSettingsFilePath(), "utf8");
    let parsed = JSON.parse(content);
    parsed = typeof parsed === "object" ? parsed : {};
    return {
      ...parsed,
      defaultOllamaHost,
      ollamaHost: parsed.ollamaHost || defaultOllamaHost,
    };
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      return {
        defaultModel: "llama3.1:latest",
        defaultTemperature: 0.5,
        defaultSystemPrompt: "",
        defaultOllamaHost,
        ollamaHost: defaultOllamaHost,
      };
    }
    throw error;
  }
}

type PartialNullable<T> = { [P in keyof T]?: T[P] | null };

export function updateGlobalSettings(
  newSettings: PartialNullable<GlobalSettings>,
  merge?: true | undefined
): Promise<void>;
export function updateGlobalSettings(
  newSettings: GlobalSettings,
  merge: false
): Promise<void>;
export async function updateGlobalSettings(
  newSettings: GlobalSettings | PartialNullable<GlobalSettings>,
  merge: boolean = true
): Promise<void> {
  const settings = merge
    ? { ...(await getGlobalSettings()), ...newSettings }
    : newSettings;

  await fsp.mkdir(path.dirname(getGlobalSettingsFilePath()), {
    recursive: true,
  });
  await fsp.writeFile(
    getGlobalSettingsFilePath(),
    JSON.stringify(settings, null, 2)
  );
}

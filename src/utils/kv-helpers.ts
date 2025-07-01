import type { APIContext } from "astro";
import type { MinimalKV } from "./types";

export const getKVContent = async (
  context: APIContext,
  key: string,
  defaultValue: string = ""
) => {
  const webflowContent = (context.locals as App.Locals).webflowContent;
  return (await webflowContent.get(key)) || defaultValue;
};

/**
 * Helper function to update a section in llms.txt while preserving other sections
 */
export async function updateLLMSSection(
  kv: MinimalKV,
  sectionTitle: string,
  sectionContent: string[]
): Promise<void> {
  // Get existing content
  const existingContent = (await kv.get("llms.txt")) || "";
  const lines = existingContent.split("\n");

  // Find section boundaries
  let sectionStart = -1;
  let sectionEnd = -1;
  let nextSectionStart = -1;

  // Find the target section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === `## ${sectionTitle}`) {
      sectionStart = i;
    } else if (
      sectionStart !== -1 &&
      line.startsWith("## ") &&
      i > sectionStart
    ) {
      nextSectionStart = i;
      sectionEnd = i - 1;
      break;
    }
  }

  // If section not found, append it
  if (sectionStart === -1) {
    const newContent = [
      ...lines,
      lines.length > 0 ? "" : "", // Add extra newline if content exists
      `## ${sectionTitle}`,
      "",
      ...sectionContent,
    ].join("\n");
    await kv.put("llms.txt", newContent);
    return;
  }

  // If no next section found, section extends to end
  if (nextSectionStart === -1) {
    sectionEnd = lines.length;
  }

  // Replace section content
  const newLines = [
    ...lines.slice(0, sectionStart + 1),
    "",
    ...sectionContent,
    "",
    ...lines.slice(nextSectionStart !== -1 ? nextSectionStart : lines.length),
  ];

  // Clean up multiple blank lines
  const cleanedLines = newLines.reduce((acc: string[], line: string) => {
    if (acc.length === 0 || !(line === "" && acc[acc.length - 1] === "")) {
      acc.push(line);
    }
    return acc;
  }, []);

  await kv.put("llms.txt", cleanedLines.join("\n"));
}

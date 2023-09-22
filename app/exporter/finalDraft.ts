import { ElementType, ScriptElement } from "../../state/elements/elements";
import * as builder from "xmlbuilder";

export function exportToFinalDraft(script: ScriptElement[]): string {
  const root = builder
    .create("FinalDraft", { version: "1.0", encoding: "UTF-8", standalone: false })
    .att("DocumentType", "Script")
    .att("Template", "No")
    .att("Version", "5");

  const content = root.ele("Content");

  script.forEach((element) => {
    let type: string;
    let paragraphNumber: null | string = null;

    switch (element.type) {
      case ElementType.SceneHeading:
        type = "Scene Heading";
        paragraphNumber = element.sceneNumber;
        break;
      case ElementType.Action:
        type = "Action";
        break;
      case ElementType.Character:
        type = "Character";
        break;
      case ElementType.Dialogue:
        type = "Dialogue";
        break;
      case ElementType.Parenthetical:
        type = "Parenthetical";
        break;
      case ElementType.Transition:
        type = "Transition";
        break;
      case ElementType.DualDialogue:
        const firstCharacter = content.ele("Paragraph", { Type: "Character" });
        firstCharacter.ele("Text", element.firstCharacter.content);

        // Handle DualDialogue separately due to its unique structure.
        element.firstContent.forEach((item) => {
          if (item.type === ElementType.Dialogue) {
            const paragraph = content.ele("Paragraph", { Type: "Dialogue" });
            paragraph.ele("Text", item.content);
          } else if (item.type === ElementType.Parenthetical) {
            const paragraph = content.ele("Paragraph", { Type: "Parenthetical" });
            paragraph.ele("Text", item.content);
          }
        });

        const secondCharacter = content.ele("Paragraph", { Type: "Character" });
        secondCharacter.ele("Text", element.secondCharacter.content);

        element.secondContent.forEach((item) => {
          if (item.type === ElementType.Dialogue) {
            const paragraph = content.ele("Paragraph", { Type: "Dialogue" });
            paragraph.ele("Text", item.content);
          } else if (item.type === ElementType.Parenthetical) {
            const paragraph = content.ele("Paragraph", { Type: "Parenthetical" });
            paragraph.ele("Text", item.content);
          }
        });
        return;
      default:
        throw new Error("Invalid element type");
    }

    const props: { Type: string; Number?: string } = { Type: type };
    if (paragraphNumber !== null) {
      props.Number = paragraphNumber;
    }
    const paragraph = content.ele("Paragraph", { Number: paragraphNumber, Type: type });
    paragraph.ele("Text", element.content);
  });

  return root.end({ pretty: true });
}

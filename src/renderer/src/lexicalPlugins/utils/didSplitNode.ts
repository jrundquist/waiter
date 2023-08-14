import { $isTextNode, RangeSelection } from "lexical";

export function didSplitNode(selection: RangeSelection): boolean {
  const anchorOffet = selection ? selection.anchor.offset : 0;
  const anchorNode = selection ? selection.anchor.getNode() : null;

  const nextSibling = anchorNode && anchorNode.getNextSibling();
  return (
    $isTextNode(anchorNode) &&
    anchorNode !== null &&
    anchorOffet > 0 &&
    anchorOffet === anchorNode!.getTextContentSize() &&
    nextSibling !== null &&
    $isTextNode(nextSibling) &&
    nextSibling.isDirty() &&
    nextSibling.getTextContentSize() > 0
  );
}

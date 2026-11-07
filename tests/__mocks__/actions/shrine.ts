import { simulateAction } from "../action-behavior";

export const createSangakuSave = async (_id: string): Promise<boolean> => {
  await simulateAction("createSangakuSave");
  return true;
};
export const dedicateSangaku = async () => {
  await simulateAction("dedicateSangaku");
  return {};
};

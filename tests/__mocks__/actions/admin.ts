export const updateUserRole = async (
  _id: string,
  _role: "general" | "admin",
): Promise<void> => {};
export const updateUser = async (): Promise<void> => {};
export const deleteSangaku = async (_id: string): Promise<void> => {};

// updateSangaku の呼び出し引数を記録するための型。
// AdminSangakuForm.spec.tsx はこの記録を page.evaluate 経由で読み取り、
// kind に応じて codeBlocks / source がどう渡されたかを検証する。
export type UpdateSangakuCall = {
  id: string;
  formData: Record<string, FormDataEntryValue>;
  codeBlocks?: { content: string; correct_position: number | null }[];
};

declare global {
  interface Window {
    __updateSangakuCalls?: UpdateSangakuCall[];
  }
}

export const updateSangaku = async (
  id: string,
  formData: FormData,
  codeBlocks?: { content: string; correct_position: number | null }[],
): Promise<boolean> => {
  window.__updateSangakuCalls = window.__updateSangakuCalls ?? [];
  window.__updateSangakuCalls.push({
    id,
    formData: Object.fromEntries(formData.entries()),
    codeBlocks,
  });
  return true;
};

export const createShrine = async (): Promise<void> => {};
export const updateShrine = async (): Promise<void> => {};
export const deleteShrine = async (_id: string): Promise<void> => {};

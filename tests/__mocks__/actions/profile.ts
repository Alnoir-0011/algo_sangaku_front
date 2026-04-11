export type State = {
  errors?: {
    nickname?: string[];
  };
  values?: {
    nickname?: string;
  };
  message?: string;
};

export const updateProfile = async (
  _prevState: State,
  _formData: FormData,
): Promise<State> => ({});

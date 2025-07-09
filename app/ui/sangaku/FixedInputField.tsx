import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { Dispatch, SetStateAction } from "react";

interface Props {
  fixedInputs: string[];
  setFixedInputs: Dispatch<SetStateAction<string[]>>;
}
export default function FixedInputField({
  fixedInputs,
  setFixedInputs,
}: Props) {
  const addInputArea = () => {
    setFixedInputs([...fixedInputs, ""]);
  };

  const removeInputField = (indexToRemove: number) => {
    setFixedInputs(fixedInputs.filter((_, i) => i !== indexToRemove));
  };
  return (
    <Box
      sx={{
        border: "1px solid black",
        borderRadius: 2,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {fixedInputs.map((value, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            borderBottom: "1px solid gray",
          }}
        >
          {/* インデックス列 */}
          <Box
            sx={{
              borderRight: "1px solid gray",
              width: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {index + 1}
          </Box>

          {/* 入力欄 */}
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              multiline
              value={value}
              variant="standard"
              slotProps={{
                htmlInput: {
                  "aria-label": `fixedInput-${index + 1}`,
                },
                input: {
                  disableUnderline: true,
                  sx: { px: 1, py: 1, fontSize: "1rem" },
                },
              }}
              onChange={(e) => {
                const newInputs = [...fixedInputs];
                newInputs[index] = e.target.value;
                setFixedInputs(newInputs);
              }}
            />
          </Box>
          <IconButton
            onClick={() => removeInputField(index)}
            size="small"
            sx={{ mx: 1 }}
            aria-label="削除"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      {/* ＋ボタン */}
      <Box sx={{ textAlign: "center", borderTop: "1px solid gray" }}>
        <IconButton
          onClick={addInputArea}
          aria-label="addButton"
          sx={{ borderRadius: 0, width: "100%" }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

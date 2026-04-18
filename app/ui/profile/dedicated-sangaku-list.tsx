import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

interface DedicatedSangaku {
  id: number;
  title: string;
  shrine_name: string;
}

interface Props {
  sangakus: DedicatedSangaku[];
}

export default function DedicatedSangakuList({ sangakus }: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        奉納済み算額
      </Typography>
      {sangakus.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          奉納済みの算額はありません
        </Typography>
      ) : (
        <List disablePadding>
          {sangakus.map((sangaku, index) => (
            <Box key={sangaku.id}>
              {index > 0 && <Divider />}
              <ListItem disableGutters>
                <ListItemText
                  primary={sangaku.title}
                  secondary={sangaku.shrine_name}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

interface Props {
  drawerWidth: number;
  handleDrawerToggle: () => void;
};

export default function Header({ drawerWidth, handleDrawerToggle }: Props) {
  return (
    <AppBar
      position="fixed"
      color='secondary'
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Avatar alt='Icon image' src="/icon.png" sx={{ mx: 'auto', height: '64px', width: '64px' }} />
      </Toolbar>
    </AppBar>
  );
}

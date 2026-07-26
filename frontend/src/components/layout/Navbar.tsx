import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Tooltip,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  Folder as FolderIcon,
  GridView as GridViewIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth0();
  const { themeMode, toggleThemeMode } = useAppAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const navItems = [
    { label: 'Collections', path: '/collections', icon: <FolderIcon fontSize="small" /> },
    { label: 'Bookmarks', path: '/bookmarks', icon: <BookmarkIcon fontSize="small" /> },
    { label: 'All Overview', path: '/all', icon: <GridViewIcon fontSize="small" /> },
  ];

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo & Title */}
          <Box
            onClick={() => navigate('/collections')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              }}
            >
              <BookmarkIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BookmarkVault
            </Typography>
          </Box>

          {/* Navigation Links */}
          {isAuthenticated && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    startIcon={item.icon}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive
                        ? themeMode === 'dark'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(99, 102, 241, 0.08)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor:
                          themeMode === 'dark'
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(99, 102, 241, 0.12)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Actions & User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}>
              <IconButton onClick={toggleThemeMode} color="inherit">
                {themeMode === 'dark' ? (
                  <LightIcon sx={{ color: '#FBBF24' }} />
                ) : (
                  <DarkIcon sx={{ color: '#64748B' }} />
                )}
              </IconButton>
            </Tooltip>

            {isAuthenticated && user && (
              <>
                <Tooltip title={user.name || user.email || 'Profile'}>
                  <IconButton onClick={handleOpenMenu} sx={{ p: 0.5 }}>
                    <Avatar
                      src={user.picture}
                      alt={user.name || 'User'}
                      sx={{
                        width: 36,
                        height: 36,
                        border: '2px solid #6366F1',
                      }}
                    >
                      {user.name ? user.name.charAt(0) : 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseMenu}
                  slotProps={{
                    paper: { sx: { mt: 1.5, borderRadius: 3, minWidth: 200, px: 1 } },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                      {user.name || 'Signed In'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

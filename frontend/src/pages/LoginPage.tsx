import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  Security as SecurityIcon,
  Share as ShareIcon,
  Speed as SpeedIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/collections" replace />;
  }

  const features = [
    {
      title: 'Absolute Privacy & Data Isolation',
      desc: 'Zero cross-user leakage. All saved links and collections belong strictly to you with strict 404 security boundaries.',
      icon: <SecurityIcon sx={{ fontSize: 32, color: '#6366F1' }} />,
    },
    {
      title: 'Smart Read-Only Sharing',
      desc: 'Generates secure, revocable share links for collections without exposing your user identity or account details.',
      icon: <ShareIcon sx={{ fontSize: 32, color: '#EC4899' }} />,
    },
    {
      title: 'Seamless Categorization',
      desc: 'Organize web links into custom collections or keep them uncategorized with automatic retention on container updates.',
      icon: <SpeedIcon sx={{ fontSize: 32, color: '#10B981' }} />,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 1) 70%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
              mb: 3,
            }}
          >
            <BookmarkIcon sx={{ fontSize: 40, color: '#FFF' }} />
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              mb: 2,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Personal Bookmark Manager
          </Typography>

          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', mb: 4 }}>
            Save, categorize, and share your web resources with guaranteed privacy and OAuth 2.0 PKCE authentication.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => loginWithRedirect()}
            startIcon={<LoginIcon />}
            sx={{
              py: 1.8,
              px: 4.5,
              fontSize: '1.1rem',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            }}
          >
            Sign In with Auth0 (PKCE)
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mt: 4 }}>
          {features.map((feat, idx) => (
            <Grid key={idx} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', p: 2 }}>
                <CardContent>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      mb: 2,
                    }}
                  >
                    {feat.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
export default LoginPage;

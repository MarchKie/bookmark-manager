import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Box, Typography } from '@mui/material';

export const CallbackPage: React.FC = () => {
  const { error, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/collections', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error">
          Authentication Callback Failed
        </Typography>
        <Typography color="text.secondary">{error.message}</Typography>
      </Box>
    );
  }

  return <LoadingSpinner message="Completing authentication flow..." minHeight="100vh" />;
};
export default CallbackPage;

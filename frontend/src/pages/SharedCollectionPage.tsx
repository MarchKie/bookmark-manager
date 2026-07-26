import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Folder as FolderIcon,
  OpenInNew as OpenInNewIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { SharedCollectionResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const SharedCollectionPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [shareData, setShareData] = useState<SharedCollectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedCollection = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError('');
        const data = await api.share.getPublic(token);
        setShareData(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('This share link does not exist, has expired, or was revoked by the collection owner.');
        } else {
          setError(err?.response?.data?.message || 'Failed to load shared collection');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCollection();
  }, [token]);

  if (loading) {
    return <LoadingSpinner message="Retrieving shared collection..." minHeight="80vh" />;
  }

  if (error || !shareData) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <LockIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Share Link Unavailable
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error || 'The requested share link could not be found.'}
          </Typography>
        </Card>
      </Container>
    );
  }

  const { collection } = shareData;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header Info */}
      <Card sx={{ p: 4, mb: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3.5,
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
            }}
          >
            <FolderIcon sx={{ fontSize: 36, color: '#FFF' }} />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {collection.name}
              </Typography>
              <Chip label="Read-Only Share" color="secondary" size="small" sx={{ fontWeight: 600 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Shared collection containing {collection.bookmarks.length} saved web link
              {collection.bookmarks.length === 1 ? '' : 's'}.
            </Typography>
          </Box>
        </Box>
      </Card>

      <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
        🔒 Privacy Guarantee: This is a read-only snapshot. No account details or owner identities are exposed.
      </Alert>

      {/* Bookmarks Grid */}
      {collection.bookmarks.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            This collection contains no bookmarks.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {collection.bookmarks.map((bm) => (
            <Grid key={bm.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 1 }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {bm.title}
                    </Typography>

                    <Tooltip title="Open URL in new tab">
                      <IconButton
                        size="small"
                        component="a"
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Chip
                    label={bm.url}
                    size="small"
                    variant="outlined"
                    sx={{
                      mb: 1.5,
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />

                  {bm.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      "{bm.notes}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
export default SharedCollectionPage;

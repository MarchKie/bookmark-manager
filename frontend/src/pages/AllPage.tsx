import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Avatar,
  Button,
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOff as FolderOffIcon,
  OpenInNew as OpenInNewIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import type { Collection, Bookmark } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ShareModal } from '../components/share/ShareModal';

export const AllPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharingCollection, setSharingCollection] = useState<Collection | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [colsData, bmsData] = await Promise.all([
        api.collections.getAll(),
        api.bookmarks.getAll(),
      ]);
      setCollections(colsData);
      setBookmarks(bmsData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch combined overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uncategorizedBookmarks = bookmarks.filter((b) => !b.collectionId);

  if (loading) {
    return <LoadingSpinner message="Loading hierarchical overview..." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Combined Overview (/all)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hierarchical view displaying collections alongside their nested bookmarks inline.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Categorized Collections Sections */}
      {collections.map((col) => {
        const colBookmarks = bookmarks.filter((b) => b.collectionId === col.id);
        return (
          <Card key={col.id} sx={{ p: 3, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                  <FolderIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {col.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {colBookmarks.length} bookmark{colBookmarks.length === 1 ? '' : 's'}
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<ShareIcon />}
                onClick={() => setSharingCollection(col)}
                sx={{ borderRadius: 2 }}
              >
                Share Link
              </Button>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {colBookmarks.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No bookmarks inside this collection yet.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {colBookmarks.map((bm) => (
                  <Grid key={bm.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        backgroundColor: 'background.default',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, maxWidth: '85%' }}>
                          {bm.title}
                        </Typography>
                        <Tooltip title="Open URL">
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
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 1 }}>
                        {bm.url}
                      </Typography>
                      {bm.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          "{bm.notes}"
                        </Typography>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Card>
        );
      })}

      {/* Uncategorized Bookmarks Section */}
      {uncategorizedBookmarks.length > 0 && (
        <Card sx={{ p: 3, borderRadius: 4, borderStyle: 'dashed' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40, borderRadius: 2 }}>
              <FolderOffIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Uncategorized Bookmarks
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {uncategorizedBookmarks.length} bookmark{uncategorizedBookmarks.length === 1 ? '' : 's'} retained without a collection
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          <Grid container spacing={2}>
            {uncategorizedBookmarks.map((bm) => (
              <Grid key={bm.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, maxWidth: '85%' }}>
                      {bm.title}
                    </Typography>
                    <Tooltip title="Open URL">
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
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 1 }}>
                    {bm.url}
                  </Typography>
                  {bm.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      "{bm.notes}"
                    </Typography>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      <ShareModal
        open={Boolean(sharingCollection)}
        onClose={() => setSharingCollection(null)}
        collection={sharingCollection}
      />
    </Box>
  );
};
export default AllPage;

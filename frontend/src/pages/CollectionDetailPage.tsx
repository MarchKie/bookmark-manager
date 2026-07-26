import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Collection, Bookmark } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreateBookmarkModal } from '../components/bookmarks/CreateBookmarkModal';
import { ShareModal } from '../components/share/ShareModal';

export const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const [colData, bmsData] = await Promise.all([
        api.collections.getById(id),
        api.collections.getBookmarks(id),
      ]);
      setCollection(colData);
      setBookmarks(bmsData);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Collection not found or access denied.');
      } else {
        setError(err?.response?.data?.message || 'Failed to fetch collection details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateBookmark = async (data: {
    url: string;
    title: string;
    notes?: string;
    collectionId?: string;
  }) => {
    await api.bookmarks.create({ ...data, collectionId: id });
    await fetchData();
  };

  const handleUpdateBookmark = async (data: {
    url: string;
    title: string;
    notes?: string;
    collectionId?: string;
  }) => {
    if (!editingBookmark) return;
    await api.bookmarks.update(editingBookmark.id, data);
    setEditingBookmark(null);
    await fetchData();
  };

  const handleDeleteBookmark = async (bmId: string, bmTitle: string) => {
    if (window.confirm(`Delete bookmark "${bmTitle}"?`)) {
      try {
        await api.bookmarks.delete(bmId);
        await fetchData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to delete bookmark');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading collection details..." />;
  }

  if (error || !collection) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Collection not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/collections')}>
          Back to Collections
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/collections" color="inherit" underline="hover">
          Collections
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          {collection.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
            }}
          >
            <FolderIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {collection.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {new Date(collection.createdAt).toLocaleDateString()} • {bookmarks.length} saved link
              {bookmarks.length === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ShareIcon />}
            onClick={() => setShareModalOpen(true)}
            sx={{ borderRadius: 3 }}
          >
            Share Collection
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setBookmarkModalOpen(true)}
            sx={{ borderRadius: 3 }}
          >
            Add Bookmark
          </Button>
        </Box>
      </Box>

      {/* Bookmarks List Grid */}
      {bookmarks.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No bookmarks in this collection
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add web links to populate this collection.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBookmarkModalOpen(true)}>
            Add Bookmark
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {bookmarks.map((bm) => (
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

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pt: 0, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(bm.createdAt).toLocaleDateString()}
                  </Typography>

                  <Box>
                    <Tooltip title="Edit Bookmark">
                      <IconButton size="small" color="primary" onClick={() => setEditingBookmark(bm)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Bookmark">
                      <IconButton size="small" color="error" onClick={() => handleDeleteBookmark(bm.id, bm.title)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modals */}
      <CreateBookmarkModal
        open={bookmarkModalOpen}
        onClose={() => setBookmarkModalOpen(false)}
        onSubmit={handleCreateBookmark}
        collections={[collection]}
        defaultCollectionId={collection.id}
      />

      <CreateBookmarkModal
        open={Boolean(editingBookmark)}
        onClose={() => setEditingBookmark(null)}
        onSubmit={handleUpdateBookmark}
        collections={[collection]}
        initialBookmark={editingBookmark}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        collection={collection}
      />
    </Box>
  );
};
export default CollectionDetailPage;

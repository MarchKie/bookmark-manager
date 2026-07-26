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
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Bookmark as BookmarkIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  FolderOff as FolderOffIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import type { Collection, Bookmark } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreateBookmarkModal } from '../components/bookmarks/CreateBookmarkModal';

export const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

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
      setError(err?.response?.data?.message || 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBookmark = async (data: {
    url: string;
    title: string;
    notes?: string;
    collectionId?: string;
  }) => {
    await api.bookmarks.create(data);
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

  const handleDeleteBookmark = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete bookmark "${title}"?`)) {
      try {
        await api.bookmarks.delete(id);
        await fetchData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to delete bookmark');
      }
    }
  };

  const filteredBookmarks = bookmarks.filter((bm) => {
    // Collection Filter
    if (selectedCollectionId === 'UNCATEGORIZED' && bm.collectionId) {
      return false;
    }
    if (
      selectedCollectionId !== 'ALL' &&
      selectedCollectionId !== 'UNCATEGORIZED' &&
      bm.collectionId !== selectedCollectionId
    ) {
      return false;
    }

    // Search Query Filter
    const query = search.toLowerCase();
    return (
      bm.title.toLowerCase().includes(query) ||
      bm.url.toLowerCase().includes(query) ||
      (bm.notes && bm.notes.toLowerCase().includes(query))
    );
  });

  if (loading && bookmarks.length === 0) {
    return <LoadingSpinner message="Loading your saved bookmarks..." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            My Bookmarks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View, filter, and manage all your saved web resources.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ borderRadius: 3, px: 3, py: 1.2 }}
        >
          Add Bookmark
        </Button>
      </Box>

      {/* Search & Filter Bar */}
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            placeholder="Search titles, URLs, or notes..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="filter-collection-label">Filter by Collection</InputLabel>
            <Select
              labelId="filter-collection-label"
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              label="Filter by Collection"
            >
              <MenuItem value="ALL">All Bookmarks ({bookmarks.length})</MenuItem>
              <MenuItem value="UNCATEGORIZED">
                Uncategorized ({bookmarks.filter((b) => !b.collectionId).length})
              </MenuItem>
              {collections.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  📁 {col.name} ({bookmarks.filter((b) => b.collectionId === col.id).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
          <Chip
            label={`${filteredBookmarks.length} Bookmark${filteredBookmarks.length === 1 ? '' : 's'} Shown`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Grid>
      </Grid>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            No bookmarks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {search || selectedCollectionId !== 'ALL'
              ? 'Try adjusting your search or collection filter.'
              : 'Add your first saved link to get started.'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
            Add Bookmark
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredBookmarks.map((bm) => (
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

                    <Tooltip title="Open link in new tab">
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
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5 }}>
                      "{bm.notes}"
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {bm.collection ? (
                      <Chip
                        icon={<FolderIcon fontSize="small" />}
                        label={bm.collection.name}
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        icon={<FolderOffIcon fontSize="small" />}
                        label="Uncategorized"
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
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
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateBookmark}
        collections={collections}
      />

      <CreateBookmarkModal
        open={Boolean(editingBookmark)}
        onClose={() => setEditingBookmark(null)}
        onSubmit={handleUpdateBookmark}
        collections={collections}
        initialBookmark={editingBookmark}
      />
    </Box>
  );
};
export default BookmarksPage;

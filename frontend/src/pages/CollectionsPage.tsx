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
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Collection } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreateCollectionModal } from '../components/collections/CreateCollectionModal';
import { ShareModal } from '../components/share/ShareModal';

export const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [sharingCollection, setSharingCollection] = useState<Collection | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.collections.getAll();
      setCollections(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async (name: string) => {
    await api.collections.create({ name });
    await fetchCollections();
  };

  const handleUpdateCollection = async (name: string) => {
    if (!editingCollection) return;
    await api.collections.update(editingCollection.id, { name });
    setEditingCollection(null);
    await fetchCollections();
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete collection "${name}"? Nested bookmarks will be retained as Uncategorized.`,
      )
    ) {
      try {
        await api.collections.delete(id);
        await fetchCollections();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to delete collection');
      }
    }
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading && collections.length === 0) {
    return <LoadingSpinner message="Loading your collections..." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            My Collections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your saved web bookmarks into private, custom containers.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ borderRadius: 3, px: 3, py: 1.2 }}
        >
          New Collection
        </Button>
      </Box>

      {/* Search Bar & Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search collections..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
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

        <Chip
          label={`${filteredCollections.length} Collection${filteredCollections.length === 1 ? '' : 's'}`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Collections Grid */}
      {filteredCollections.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {search ? 'No matching collections' : 'No collections yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {search
              ? 'Try adjusting your search filter.'
              : 'Create your first collection to start categorizing your web bookmarks.'}
          </Typography>
          {!search && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
              Create Collection
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCollections.map((col) => (
            <Grid key={col.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 1,
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      <FolderIcon />
                    </Avatar>

                    <Chip
                      label={`${col._count?.bookmarks || 0} Bookmark${(col._count?.bookmarks || 0) === 1 ? '' : 's'}`}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </Box>

                  <Typography
                    variant="h6"
                    noWrap
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => navigate(`/collections/${col.id}`)}
                  >
                    {col.name}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Created {new Date(col.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pt: 0, pb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Share Read-Only Link (ADR-05)">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => setSharingCollection(col)}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit Collection Name">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setEditingCollection(col)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Collection">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCollection(col.id, col.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/collections/${col.id}`)}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modals */}
      <CreateCollectionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCollection}
      />

      <CreateCollectionModal
        open={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        onSubmit={handleUpdateCollection}
        initialName={editingCollection?.name}
        isEdit
      />

      <ShareModal
        open={Boolean(sharingCollection)}
        onClose={() => setSharingCollection(null)}
        collection={sharingCollection}
      />
    </Box>
  );
};
export default CollectionsPage;

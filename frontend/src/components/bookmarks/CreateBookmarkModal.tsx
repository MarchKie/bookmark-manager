import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Bookmark as BookmarkIcon } from '@mui/icons-material';
import type { Collection, Bookmark } from '../../types';

interface CreateBookmarkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    url: string;
    title: string;
    notes?: string;
    collectionId?: string;
  }) => Promise<void>;
  collections: Collection[];
  initialBookmark?: Bookmark | null;
  defaultCollectionId?: string;
}

export const CreateBookmarkModal: React.FC<CreateBookmarkModalProps> = ({
  open,
  onClose,
  onSubmit,
  collections,
  initialBookmark = null,
  defaultCollectionId = '',
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialBookmark) {
      setUrl(initialBookmark.url);
      setTitle(initialBookmark.title);
      setNotes(initialBookmark.notes || '');
      setCollectionId(initialBookmark.collectionId || '');
    } else {
      setUrl('');
      setTitle('');
      setNotes('');
      setCollectionId(defaultCollectionId || '');
    }
    setError('');
  }, [initialBookmark, defaultCollectionId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('URL is required');
      return;
    }
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        url: url.trim(),
        title: title.trim(),
        notes: notes.trim() || undefined,
        collectionId: collectionId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
            }}
          >
            <BookmarkIcon fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {initialBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="URL"
              type="url"
              fullWidth
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={loading}
            />

            <TextField
              label="Title"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bookmark title"
              required
              disabled={loading}
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel id="collection-select-label">Collection (Optional)</InputLabel>
              <Select
                labelId="collection-select-label"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                label="Collection (Optional)"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Uncategorized</em>
                </MenuItem>
                {collections.map((col) => (
                  <MenuItem key={col.id} value={col.id}>
                    📁 {col.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes or summary..."
              disabled={loading}
            />

            {error && (
              <Typography color="error" variant="caption">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : initialBookmark ? 'Update' : 'Add Bookmark'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

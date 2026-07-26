import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import type { Collection, ShareToken } from '../../types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  collection: Collection | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, collection }) => {
  const [shareData, setShareData] = useState<ShareToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const shareUrl = shareData
    ? `${window.location.origin}/share/${shareData.shareToken}`
    : '';

  useEffect(() => {
    if (open && collection) {
      handleGenerate();
    } else {
      setShareData(null);
      setError('');
    }
  }, [open, collection]);

  const handleGenerate = async () => {
    if (!collection) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.share.generate(collection.id);
      setShareData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async () => {
    if (!shareData) return;
    try {
      setLoading(true);
      setError('');
      await api.share.revoke(shareData.shareToken);
      setShareData(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to revoke share token');
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
          }}
        >
          <ShareIcon fontSize="small" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Share Collection (Read-Only Link)
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Anyone with this link can view collection <strong>"{collection?.name}"</strong> and its saved bookmarks without signing in. No editing permissions are granted, and your account details remain completely private.
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && shareData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={shareUrl}
                slotProps={{ input: { readOnly: true } }}
              />
              <Tooltip title={copied ? 'Copied!' : 'Copy Share Link'}>
                <Button
                  variant="contained"
                  onClick={handleCopy}
                  startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                  color={copied ? 'success' : 'primary'}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
            </Box>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Regenerating the link invalidates any previously shared URL immediately.
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button
                size="small"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={handleGenerate}
                disabled={loading}
              >
                Regenerate Link
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRevoke}
                disabled={loading}
              >
                Revoke Link
              </Button>
            </Box>
          </Box>
        )}

        {!loading && !shareData && !error && (
          <Button variant="contained" fullWidth onClick={handleGenerate} startIcon={<ShareIcon />}>
            Generate Read-Only Link
          </Button>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useProfile } from '@/hooks/useProfile';

export default function ServicesPage() {
  const {
    profile,
    addService, isAddingService, deleteService, updateService,
  } = useProfile();

  // Service dialog state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<{ id: string } | null>(null);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServicePricingType, setNewServicePricingType] = useState('fixed');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDeliveryTime, setNewServiceDeliveryTime] = useState('');

  const openAddServiceDialog = () => {
    setEditingService(null);
    setNewServiceTitle('');
    setNewServiceDescription('');
    setNewServiceCategory('');
    setNewServicePricingType('fixed');
    setNewServicePrice('');
    setNewServiceDeliveryTime('');
    setServiceDialogOpen(true);
  };

  const openEditServiceDialog = (service: { id: string; title: string; description?: string | null; category: string; pricingType: string; price?: string | null; deliveryTime?: string | null }) => {
    setEditingService({ id: service.id });
    setNewServiceTitle(service.title);
    setNewServiceDescription(service.description || '');
    setNewServiceCategory(service.category);
    setNewServicePricingType(service.pricingType);
    setNewServicePrice(service.price || '');
    setNewServiceDeliveryTime(service.deliveryTime || '');
    setServiceDialogOpen(true);
  };

  const handleSaveService = () => {
    if (!newServiceTitle.trim() || !newServiceCategory || !newServicePricingType) return;
    if (editingService) {
      updateService({
        serviceId: editingService.id,
        title: newServiceTitle.trim(),
        category: newServiceCategory,
        pricingType: newServicePricingType,
        description: newServiceDescription || undefined,
        price: newServicePrice || undefined,
        deliveryTime: newServiceDeliveryTime || undefined,
      });
    } else {
      addService({
        title: newServiceTitle.trim(),
        category: newServiceCategory,
        pricingType: newServicePricingType,
        description: newServiceDescription || undefined,
        price: newServicePrice || undefined,
        deliveryTime: newServiceDeliveryTime || undefined,
      });
    }
    setServiceDialogOpen(false);
    setEditingService(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Service Offerings Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Service Offerings
            </Typography>
            <Button
              startIcon={<AddIcon />}
              size="small"
              onClick={openAddServiceDialog}
            >
              Add Service
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {profile?.serviceOfferings && profile.serviceOfferings.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Delivery</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profile.serviceOfferings.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {service.title}
                        </Typography>
                        {service.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {service.description.length > 60
                              ? `${service.description.substring(0, 60)}...`
                              : service.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={service.category} size="small" />
                      </TableCell>
                      <TableCell>
                        {service.price ? `$${service.price}` : '--'}
                        {service.pricingType === 'hourly' ? '/hr' : ''}
                      </TableCell>
                      <TableCell>
                        {service.deliveryTime || '--'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEditServiceDialog(service)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteService(service.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No services offered yet. Click &quot;Add Service&quot; to list your first offering.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Tips for Service Listings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Be specific about what&apos;s included in each service<br />
            • Set realistic delivery times<br />
            • Consider offering packages at different price points<br />
            • Update availability regularly
          </Typography>
        </CardContent>
      </Card>

      {/* Service Dialog (Add/Edit) */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingService ? 'Edit Service Offering' : 'Add Service Offering'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Service Title"
                placeholder="e.g., SOC 2 Readiness Assessment"
                value={newServiceTitle}
                onChange={(e) => setNewServiceTitle(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                placeholder="Describe what's included in this service..."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                >
                  <MenuItem value="Assessors">Assessors</MenuItem>
                  <MenuItem value="Advisors">Advisors</MenuItem>
                  <MenuItem value="Agentic">Agentic</MenuItem>
                  <MenuItem value="SecOps">SecOps</MenuItem>
                  <MenuItem value="DevSecOps">DevSecOps</MenuItem>
                  <MenuItem value="Data Entry">Data Entry</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Pricing Type</InputLabel>
                <Select
                  label="Pricing Type"
                  value={newServicePricingType}
                  onChange={(e) => setNewServicePricingType(e.target.value)}
                >
                  <MenuItem value="fixed">Fixed Price</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="subscription">Subscription</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Delivery Time"
                placeholder="e.g., 2 weeks"
                value={newServiceDeliveryTime}
                onChange={(e) => setNewServiceDeliveryTime(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={!newServiceTitle.trim() || !newServiceCategory || isAddingService}
          >
            {editingService
              ? 'Save'
              : (isAddingService ? 'Adding...' : 'Add Service')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
